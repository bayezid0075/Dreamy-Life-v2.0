import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './infrastructure/database/schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  const pool = new Pool({
    connectionString: configService.get('DATABASE_URL'),
  });

  const db = drizzle(pool, { schema });

  const adminUsername = 'admin';
  const adminPassword = 'admin123';
  const adminPhone = '+8800000000000';

  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.username, adminUsername),
  });

  if (existingUser) {
    if (existingUser.memberStatus !== 'super_admin') {
      await db
        .update(schema.users)
        .set({ memberStatus: 'super_admin', updatedAt: new Date() })
        .where(eq(schema.users.id, existingUser.id));
      console.log(`User "${adminUsername}" promoted to super_admin`);
    } else {
      console.log(`User "${adminUsername}" is already super_admin`);
    }
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const ownRefercode = Math.floor(10000000 + Math.random() * 90000000).toString();

    const [newUser] = await db
      .insert(schema.users)
      .values({
        username: adminUsername,
        phoneNumber: adminPhone,
        password: passwordHash,
        ownRefercode,
        memberStatus: 'super_admin',
      })
      .returning();

    await db.insert(schema.userInfo).values({ userId: newUser.id });

    console.log(`Super admin user created:`);
    console.log(`  Username: ${adminUsername}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Phone: ${adminPhone}`);
    console.log(`  Status: super_admin`);
  }

  await pool.end();
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
