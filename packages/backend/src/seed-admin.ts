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

  const adminEmail = 'admin@dreamylife.com';
  const adminAccessCode = 'ADMIN001';
  const adminPassword = 'admin123';

  const existingAdmin = await db.query.admins.findFirst({
    where: eq(schema.admins.email, adminEmail),
  });

  if (existingAdmin) {
    console.log(`Admin with email "${adminEmail}" already exists`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await db.insert(schema.admins).values({
      email: adminEmail,
      accessCode: adminAccessCode,
      password: passwordHash,
    });

    console.log(`Admin created:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Access Code: ${adminAccessCode}`);
    console.log(`  Password: ${adminPassword}`);
  }

  await pool.end();
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
