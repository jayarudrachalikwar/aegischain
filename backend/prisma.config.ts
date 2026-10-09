import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma CLI does not read the app's *_FILE secrets, so resolve DATABASE_URL here:
// DATABASE_URL, else the file named by DATABASE_URL_FILE (never committed, see infra/scripts/gen-secrets.mjs).
function databaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = process.env.DATABASE_URL_FILE
    ? resolve(process.env.DATABASE_URL_FILE)
    : resolve(__dirname, '../infra/secrets/database_url');
  return existsSync(file) ? readFileSync(file, 'utf8').trim() : undefined;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl() ?? '' },
});
