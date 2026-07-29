import * as fs from 'fs';
import * as path from 'path';

const DUMP_PATH = process.env.USERS_DUMP_PATH || path.resolve(__dirname, '../../../../users_data.sql');
const LOG_DIR = path.resolve(__dirname, '../../../../migration-logs');
const BCRYPT_ROUNDS = 10;
const DRY_RUN = process.argv.includes('--dry-run');

const CORRUPTED_REFS = new Set(['Bkash', 'Nagad', 'Rocket', 'bkash', 'nagad', 'rocket']);

interface OldUser {
  id: number;
  username: string;
  phone: string;
  email: string;
  password: string;
  referral_code: string;
  referred_by: string | null;
  wallet_balance: number;
  member_type: string;
}

interface TransformedUser {
  id: string;
  old_id: number;
  username: string;
  email: string;
  phone_number: string;
  password: string;
  own_refercode: string;
  referred_by: string | null;
  member_status: string;
  is_verified: boolean;
  wallet_balance: number;
  old_referral_code: string;
}

function generateUnique8Digit(existing: Set<string>): string {
  while (true) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    if (!existing.has(code)) {
      existing.add(code);
      return code;
    }
  }
}

function mapMemberType(memberType: string): { status: string; verified: boolean } {
  switch (memberType) {
    case 'Active':
      return { status: 'basic', verified: true };
    case 'Admin':
      return { status: 'super_admin', verified: true };
    default:
      return { status: 'user', verified: false };
  }
}

function unescapeSql(val: string): string {
  return val.replace(/''/g, "'").trim();
}

function parseSqlValue(val: string): string | null {
  val = val.trim();
  if (val === 'NULL') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return unescapeSql(val.slice(1, -1));
  }
  return val;
}

function parseRow(rowStr: string): OldUser | null {
  // Remove leading ( and trailing ) or ),
  let cleaned = rowStr.trim();
  if (cleaned.startsWith('(')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('),') || cleaned.endsWith(')')) {
    cleaned = cleaned.substring(0, cleaned.length - (cleaned.endsWith('),') ? 2 : 1));
  }

  // Split by comma but respect quoted strings
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === quoteChar && cleaned[i + 1] === quoteChar) {
        current += ch + ch;
        i++;
      } else if (ch === quoteChar) {
        current += ch;
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === "'" || ch === '"') {
        inQuotes = true;
        quoteChar = ch;
        current += ch;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  if (current.trim()) fields.push(current.trim());

  if (fields.length < 10) return null;

  const id = parseInt(fields[0]);
  if (isNaN(id)) return null;

  const username = parseSqlValue(fields[1]) || '';
  const phone = parseSqlValue(fields[2]) || '';
  const email = parseSqlValue(fields[3]) || '';
  const password = parseSqlValue(fields[4]) || '';
  const referral_code = parseSqlValue(fields[5]) || '';
  const referred_by = parseSqlValue(fields[6]);
  const wallet_balance = parseFloat(fields[8]) || 0;
  const member_type = parseSqlValue(fields[9]) || 'Created';

  return { id, username, phone, email, password, referral_code, referred_by, wallet_balance, member_type };
}

async function main() {
  console.log('=== Dreamy Life User Migration ===');
  if (DRY_RUN) console.log('*** DRY RUN MODE — no DB changes ***');
  console.log(`Dump path: ${DUMP_PATH}\n`);

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Step 1: Read dump
  console.log('[1/6] Reading SQL dump...');
  const content = fs.readFileSync(DUMP_PATH, 'utf-8');
  const insertPattern = /INSERT INTO `users`[^;]+;/g;
  const insertBlocks = content.match(insertPattern) || [];
  console.log(`  Found ${insertBlocks.length} INSERT blocks`);

  // Step 2: Parse — split each block by VALUES, then split rows
  console.log('\n[2/6] Parsing user rows...');
  const allOldUsers: OldUser[] = [];
  for (const block of insertBlocks) {
    const valuesPart = block.split(/VALUES\s+/i)[1] || '';
    // Split rows: each row starts with ( and previous ends with ),
    const rawRows = valuesPart.split(/\),\s*\n\s*\(/);
    for (const raw of rawRows) {
      const user = parseRow(raw);
      if (user) allOldUsers.push(user);
    }
  }
  console.log(`  Parsed ${allOldUsers.length} rows`);

  // Dedup by old_id
  const seenIds = new Map<number, OldUser>();
  for (const user of allOldUsers) {
    seenIds.set(user.id, user);
  }
  const oldUsers = Array.from(seenIds.values());
  console.log(`  After dedup: ${oldUsers.length} unique users`);

  // Data quality
  const emptyPhones = oldUsers.filter(u => !u.phone || u.phone === '');
  const corruptedRefs = oldUsers.filter(u => u.referred_by && CORRUPTED_REFS.has(u.referred_by));
  const emptyPasswords = oldUsers.filter(u => !u.password || u.password === '');
  const memberCounts: Record<string, number> = {};
  for (const u of oldUsers) {
    memberCounts[u.member_type] = (memberCounts[u.member_type] || 0) + 1;
  }

  console.log('\n--- Data Quality Report ---');
  console.log(`  Total users:        ${oldUsers.length}`);
  console.log(`  Empty phones:       ${emptyPhones.length}`);
  console.log(`  Corrupted ref_by:   ${corruptedRefs.length} (Bkash/Nagad/Rocket)`);
  console.log(`  Empty passwords:    ${emptyPasswords.length}`);
  console.log(`  Member breakdown:   ${JSON.stringify(memberCounts)}`);

  // Collect all unique referral codes
  const allOldCodes = new Set(oldUsers.map(u => u.referral_code).filter(Boolean));
  console.log(`  Unique old referral codes: ${allOldCodes.size}`);

  // Check for codes > 8 chars (will need to be truncated or new ones generated)
  const longCodes = Array.from(allOldCodes).filter(c => c.length > 8);
  console.log(`  Codes longer than 8 chars: ${longCodes.length}`);
  if (longCodes.length > 0) {
    console.log(`  Sample long codes: ${longCodes.slice(0, 5).join(', ')}`);
  }

  fs.writeFileSync(
    path.join(LOG_DIR, 'data-quality.txt'),
    JSON.stringify({
      totalUsers: oldUsers.length,
      emptyPhones: emptyPhones.map(u => ({ id: u.id, username: u.username })),
      corruptedRefs: corruptedRefs.map(u => ({ id: u.id, referred_by: u.referred_by })),
      emptyPasswords: emptyPasswords.map(u => ({ id: u.id, username: u.username })),
      memberCounts,
      uniqueOldCodes: allOldCodes.size,
      longCodes: longCodes.slice(0, 20),
    }, null, 2)
  );

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopping here — no database changes.');
    console.log(`  Logs: ${LOG_DIR}`);
    return;
  }

  // --- LIVE MODE ---
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { eq, sql } = await import('drizzle-orm');
  const schema = await import('../infrastructure/database/schema');
  const bcrypt = await import('bcrypt');
  const { v4: uuidv4 } = await import('uuid');

  console.log('\n[3/6] Connecting to PostgreSQL...');
  const dbUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: dbUrl || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  const db = drizzle(pool, { schema });

  const existingUsernames = new Set(
    (await db.select({ username: schema.users.username }).from(schema.users)).map(u => u.username)
  );
  const existingEmails = new Set(
    (await db.select({ email: schema.users.email }).from(schema.users)).map(u => u.email)
  );
  const existingPhones = new Set(
    (await db.select({ phoneNumber: schema.users.phoneNumber }).from(schema.users)).map(u => u.phoneNumber)
  );
  console.log(`  Existing users in DB: ${existingUsernames.size}`);

  // Step 4: Transform
  console.log('\n[4/6] Transforming data...');
  const usedReferCodes = new Set<string>();
  const usedUsernames = new Set(existingUsernames);
  const usedEmails = new Set(existingEmails);
  const usedPhones = new Set(existingPhones);

  // Build old→new referral code mapping
  const oldToNewCodeMap = new Map<string, string>();
  for (const oldCode of allOldCodes) {
    oldToNewCodeMap.set(oldCode, generateUnique8Digit(usedReferCodes));
  }

  const transformedUsers: TransformedUser[] = [];
  for (const old of oldUsers) {
    let phone = old.phone || `nophone_${old.id}@placeholder.local`;

    // Dedup username
    let username = old.username;
    let suffix = 0;
    while (usedUsernames.has(username)) {
      suffix++;
      username = `${old.username}_old${old.id}${suffix > 1 ? '_' + suffix : ''}`;
    }
    usedUsernames.add(username);

    // Dedup email
    let email = old.email;
    if (usedEmails.has(email)) {
      email = `dup_${old.id}_${email}`;
    }
    usedEmails.add(email);

    // Dedup phone
    let phoneNumber = phone;
    if (usedPhones.has(phoneNumber)) {
      phoneNumber = `dup_${old.id}_${phoneNumber}`;
    }
    usedPhones.add(phoneNumber);

    // Hash password
    let password = old.password || 'CHANGE_ME_NOW';
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // New 8-digit referral code
    const ownRefercode = generateUnique8Digit(usedReferCodes);

    // Map referred_by through old→new mapping
    let referredBy: string | null = null;
    if (old.referred_by && !CORRUPTED_REFS.has(old.referred_by)) {
      referredBy = oldToNewCodeMap.get(old.referred_by) || null;
    }

    const { status: memberStatus, verified: isVerified } = mapMemberType(old.member_type);

    transformedUsers.push({
      id: uuidv4(),
      old_id: old.id,
      username,
      email,
      phone_number: phoneNumber,
      password: passwordHash,
      own_refercode: ownRefercode,
      referred_by: referredBy,
      member_status: memberStatus,
      is_verified: isVerified,
      wallet_balance: old.wallet_balance,
      old_referral_code: old.referral_code,
    });
  }
  console.log(`  Transformed ${transformedUsers.length} users`);

  // Save mapping
  const mappingLog = transformedUsers.map(u => ({
    old_id: u.old_id,
    new_id: u.id,
    username: u.username,
    old_referral_code: u.old_referral_code,
    new_refercode: u.own_refercode,
    old_referred_by: oldUsers.find(o => o.id === u.old_id)?.referred_by,
    new_referred_by: u.referred_by,
  }));
  fs.writeFileSync(path.join(LOG_DIR, 'user-mapping.json'), JSON.stringify(mappingLog, null, 2));
  console.log(`  Mapping saved to ${path.join(LOG_DIR, 'user-mapping.json')}`);

  // Step 5: Insert users
  console.log('\n[5/6] Inserting users...');
  let inserted = 0;
  let failed = 0;
  const errors: { old_id: number; error: string }[] = [];

  for (let i = 0; i < transformedUsers.length; i += 100) {
    const batch = transformedUsers.slice(i, i + 100);
    for (const u of batch) {
      try {
        await db.insert(schema.users).values({
          id: u.id as any,
          username: u.username,
          email: u.email,
          phoneNumber: u.phone_number,
          password: u.password,
          ownRefercode: u.own_refercode,
          referredBy: u.referred_by,
          memberStatus: u.member_status,
          isVerified: u.is_verified,
        });
        inserted++;
      } catch (err: any) {
        failed++;
        errors.push({ old_id: u.old_id, error: err.message });
      }
    }
    const pct = Math.round(((i + batch.length) / transformedUsers.length) * 100);
    process.stdout.write(`\r  Progress: ${pct}% (${inserted} ok, ${failed} fail)`);
  }
  console.log('\n');

  // Wallet balances
  console.log('  [5b] Inserting wallet balances...');
  let walletsInserted = 0;
  for (const u of transformedUsers) {
    if (u.wallet_balance > 0) {
      try {
        await db.insert(schema.userWallets).values({
          userId: u.id as any,
          balance: String(u.wallet_balance),
        });
        walletsInserted++;
      } catch {}
    }
  }
  console.log(`  Inserted ${walletsInserted} wallet balances`);

  if (errors.length > 0) {
    fs.writeFileSync(path.join(LOG_DIR, 'errors.json'), JSON.stringify(errors, null, 2));
    console.log(`  Errors logged to ${path.join(LOG_DIR, 'errors.json')}`);
  }

  // Step 6: Rebuild referral trees
  console.log('\n[6/6] Rebuilding referral trees...');
  await db.delete(schema.referrals);

  const referredUsers = await db
    .select({ id: schema.users.id, referredBy: schema.users.referredBy })
    .from(schema.users)
    .where(sql`${schema.users.referredBy} IS NOT NULL`);

  let rebuilt = 0;
  for (const user of referredUsers) {
    if (!user.referredBy) continue;
    let currentReferCode: string | null = user.referredBy;
    let level = 1;

    while (currentReferCode && level <= 10) {
      const referrer = await db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferCode),
      });
      if (!referrer) break;

      try {
        await db.insert(schema.referrals).values({
          referrerId: referrer.id,
          referredId: user.id,
          level,
          commissionRate: '0.00',
        });
      } catch {}

      currentReferCode = referrer.referredBy || null;
      level++;
    }
    rebuilt++;
  }
  console.log(`  Rebuilt trees for ${rebuilt} users`);

  console.log('\n=== Migration Complete ===');
  console.log(`  Users inserted:     ${inserted}`);
  console.log(`  Users failed:       ${failed}`);
  console.log(`  Wallets imported:   ${walletsInserted}`);
  console.log(`  Referral trees:     ${rebuilt}`);
  console.log(`  Logs:               ${LOG_DIR}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
