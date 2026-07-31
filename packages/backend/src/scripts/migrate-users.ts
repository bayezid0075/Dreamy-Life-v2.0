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

function generateUnique8Digit(existing: Set<string>): string {
  while (true) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    if (!existing.has(code)) { existing.add(code); return code; }
  }
}

function mapMemberType(memberType: string): { status: string; verified: boolean } {
  switch (memberType) {
    case 'Active': return { status: 'basic', verified: true };
    case 'Admin': return { status: 'super_admin', verified: true };
    default: return { status: 'user', verified: false };
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
  let cleaned = rowStr.trim();
  if (cleaned.startsWith('(')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('),') || cleaned.endsWith(')')) {
    cleaned = cleaned.substring(0, cleaned.length - (cleaned.endsWith('),') ? 2 : 1));
  }

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

  return {
    id,
    username: parseSqlValue(fields[1]) || '',
    phone: parseSqlValue(fields[2]) || '',
    email: parseSqlValue(fields[3]) || '',
    password: parseSqlValue(fields[4]) || '',
    referral_code: parseSqlValue(fields[5]) || '',
    referred_by: parseSqlValue(fields[6]),
    wallet_balance: parseFloat(fields[8]) || 0,
    member_type: parseSqlValue(fields[9]) || 'Created',
  };
}

async function main() {
  console.log('=== Dreamy Life User Migration (v2) ===');
  if (DRY_RUN) console.log('*** DRY RUN MODE — no DB changes ***');
  console.log(`Dump: ${DUMP_PATH}\n`);

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // ── Step 1: Parse ────────────────────────────────────────────────────
  console.log('[1/7] Reading SQL dump...');
  const content = fs.readFileSync(DUMP_PATH, 'utf-8');
  const insertPattern = /INSERT INTO `users`[^;]+;/g;
  const insertBlocks = content.match(insertPattern) || [];
  console.log(`  Found ${insertBlocks.length} INSERT blocks`);

  console.log('\n[2/7] Parsing user rows...');
  const allOldUsers: OldUser[] = [];
  for (const block of insertBlocks) {
    const valuesPart = block.split(/VALUES\s+/i)[1] || '';
    const rawRows = valuesPart.split(/\),\s*\n\s*\(/);
    for (const raw of rawRows) {
      const user = parseRow(raw);
      if (user) allOldUsers.push(user);
    }
  }
  console.log(`  Parsed ${allOldUsers.length} rows`);

  // Dedup by old_id
  const seenIds = new Map<number, OldUser>();
  for (const user of allOldUsers) seenIds.set(user.id, user);
  const oldUsers = Array.from(seenIds.values());
  console.log(`  After dedup: ${oldUsers.length} unique users`);

  // ── Step 2: Filter duplicates (keep first, skip rest) ───────────────
  console.log('\n[3/7] Filtering duplicates...');
  const seenUsernames = new Set<string>();
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenRefCodes = new Set<string>();

  const importedUsers: OldUser[] = [];
  const skippedUsers: { user: OldUser; reason: string }[] = [];

  for (const old of oldUsers) {
    // Skip empty phone
    if (!old.phone || old.phone === '') {
      skippedUsers.push({ user: old, reason: 'empty_phone' });
      continue;
    }

    // Skip empty password
    if (!old.password || old.password === '') {
      skippedUsers.push({ user: old, reason: 'empty_password' });
      continue;
    }

    // Skip duplicate username
    if (seenUsernames.has(old.username)) {
      skippedUsers.push({ user: old, reason: 'duplicate_username' });
      continue;
    }

    // Skip duplicate email
    if (seenEmails.has(old.email)) {
      skippedUsers.push({ user: old, reason: 'duplicate_email' });
      continue;
    }

    // Skip duplicate phone
    if (seenPhones.has(old.phone)) {
      skippedUsers.push({ user: old, reason: 'duplicate_phone' });
      continue;
    }

    // Skip duplicate referral code
    if (old.referral_code && seenRefCodes.has(old.referral_code)) {
      skippedUsers.push({ user: old, reason: 'duplicate_referral_code' });
      continue;
    }

    seenUsernames.add(old.username);
    seenEmails.add(old.email);
    seenPhones.add(old.phone);
    if (old.referral_code) seenRefCodes.add(old.referral_code);
    importedUsers.push(old);
  }

  console.log(`  Imported: ${importedUsers.length}`);
  console.log(`  Skipped:  ${skippedUsers.length}`);

  const skipReasons: Record<string, number> = {};
  for (const s of skippedUsers) skipReasons[s.reason] = (skipReasons[s.reason] || 0) + 1;
  console.log(`  Skip reasons: ${JSON.stringify(skipReasons)}`);

  // ── Step 3: Build referral code mapping (only from imported users) ───
  console.log('\n[4/7] Building referral code mapping...');
  const usedRefCodes = new Set<string>();
  const oldToNewCodeMap = new Map<string, string>();

  for (const user of importedUsers) {
    if (user.referral_code && !oldToNewCodeMap.has(user.referral_code)) {
      oldToNewCodeMap.set(user.referral_code, generateUnique8Digit(usedRefCodes));
    }
  }
  console.log(`  Mapped ${oldToNewCodeMap.size} referral codes`);

  // Verify referral chain integrity
  let chainBroken = 0;
  for (const user of importedUsers) {
    if (user.referred_by && !CORRUPTED_REFS.has(user.referred_by)) {
      if (!oldToNewCodeMap.has(user.referred_by)) {
        chainBroken++;
      }
    }
  }
  console.log(`  Referral chains that will break (referrer not imported): ${chainBroken}`);

  // Data quality report
  const memberCounts: Record<string, number> = {};
  for (const u of importedUsers) {
    memberCounts[u.member_type] = (memberCounts[u.member_type] || 0) + 1;
  }
  console.log(`  Member breakdown: ${JSON.stringify(memberCounts)}`);

  // Save logs
  fs.writeFileSync(
    path.join(LOG_DIR, 'data-quality.txt'),
    JSON.stringify({
      totalParsed: oldUsers.length,
      imported: importedUsers.length,
      skipped: skippedUsers.length,
      skipReasons,
      chainBroken,
      memberCounts,
    }, null, 2)
  );
  fs.writeFileSync(
    path.join(LOG_DIR, 'skipped-users.json'),
    JSON.stringify(skippedUsers.map(s => ({ id: s.user.id, username: s.user.username, reason: s.reason })), null, 2)
  );

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopping here — no database changes.');
    console.log(`  Logs: ${LOG_DIR}`);
    return;
  }

  // ── LIVE MODE ──────────────────────────────────────────────────────
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { eq, sql } = await import('drizzle-orm');
  const schema = await import('../infrastructure/database/schema');
  const bcrypt = await import('bcrypt');
  const { v4: uuidv4 } = await import('uuid');

  console.log('\n[5/7] Connecting to PostgreSQL...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  const db = drizzle(pool, { schema });

  // ── Step 5: Clear existing data ────────────────────────────────────
  console.log('\n[5b/7] Clearing existing data...');
  await db.delete(schema.referrals);
  await db.delete(schema.userWallets);
  await db.delete(schema.users);
  console.log('  Cleared referrals, user_wallets, users');

  // ── Step 6: Insert users ───────────────────────────────────────────
  console.log('\n[6/7] Inserting users...');
  let inserted = 0;
  let failed = 0;
  const errors: { old_id: number; error: string }[] = [];
  const importedIdMap = new Map<number, string>(); // old_id → new UUID

  for (let i = 0; i < importedUsers.length; i += 100) {
    const batch = importedUsers.slice(i, i + 100);
    for (const old of batch) {
      const newId = uuidv4();
      importedIdMap.set(old.id, newId);

      const ownRefercode = oldToNewCodeMap.get(old.referral_code) || generateUnique8Digit(usedRefCodes);

      let referredBy: string | null = null;
      if (old.referred_by && !CORRUPTED_REFS.has(old.referred_by)) {
        referredBy = oldToNewCodeMap.get(old.referred_by) || null;
      }

      const { status: memberStatus, verified: isVerified } = mapMemberType(old.member_type);
      const passwordHash = await bcrypt.hash(old.password, BCRYPT_ROUNDS);

      try {
        await db.insert(schema.users).values({
          id: newId as any,
          username: old.username,
          email: old.email,
          phoneNumber: old.phone,
          password: passwordHash,
          ownRefercode,
          referredBy,
          memberStatus,
          isVerified,
        });
        inserted++;
      } catch (err: any) {
        failed++;
        errors.push({ old_id: old.id, error: err.message });
      }
    }
    const pct = Math.round(((i + batch.length) / importedUsers.length) * 100);
    process.stdout.write(`\r  Progress: ${pct}% (${inserted} ok, ${failed} fail)`);
  }
  console.log('\n');

  // ── Step 6b: Insert wallet balances ────────────────────────────────
  console.log('  [6b] Inserting wallet balances...');
  let walletsInserted = 0;
  for (const old of importedUsers) {
    if (old.wallet_balance > 0) {
      const newId = importedIdMap.get(old.id);
      if (newId) {
        try {
          await db.insert(schema.userWallets).values({
            userId: newId as any,
            balance: String(old.wallet_balance),
          });
          walletsInserted++;
        } catch {}
      }
    }
  }
  console.log(`  Inserted ${walletsInserted} wallet balances`);

  if (errors.length > 0) {
    fs.writeFileSync(path.join(LOG_DIR, 'errors.json'), JSON.stringify(errors, null, 2));
    console.log(`  Errors logged to ${path.join(LOG_DIR, 'errors.json')}`);
  }

  // ── Step 7: Rebuild referral trees ──────────────────────────────────
  console.log('\n[7/7] Rebuilding referral trees...');

  // Save the mapping for verification
  const mappingLog = importedUsers.map(old => ({
    old_id: old.id,
    new_id: importedIdMap.get(old.id),
    username: old.username,
    old_referral_code: old.referral_code,
    new_refercode: oldToNewCodeMap.get(old.referral_code),
    old_referred_by: old.referred_by,
    new_referred_by: old.referred_by && !CORRUPTED_REFS.has(old.referred_by)
      ? oldToNewCodeMap.get(old.referred_by) || null
      : null,
  }));
  fs.writeFileSync(path.join(LOG_DIR, 'user-mapping.json'), JSON.stringify(mappingLog, null, 2));

  // Rebuild by walking each user's referred_by chain
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

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n=== Migration Complete ===');
  console.log(`  Users inserted:     ${inserted}`);
  console.log(`  Users failed:       ${failed}`);
  console.log(`  Users skipped:      ${skippedUsers.length}`);
  console.log(`  Wallets imported:   ${walletsInserted}`);
  console.log(`  Referral trees:     ${rebuilt}`);
  console.log(`  Logs:               ${LOG_DIR}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
