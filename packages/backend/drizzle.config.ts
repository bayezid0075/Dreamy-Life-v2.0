import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || '<YOUR_DB_USER>'}:${process.env.DB_PASSWORD || '<YOUR_DB_PASSWORD>'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || '<YOUR_DB_NAME>'}`;

console.log('[drizzle.config] DATABASE_URL:', databaseUrl ? '<set>' : '<empty>');

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
