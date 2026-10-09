#!/usr/bin/env node
// Generates local development secrets into infra/secrets/ (git-ignored).
// - Never prints secret values.
// - Never overwrites an existing file unless --force is passed.
// - Files are written with mode 0600 where the OS supports it (POSIX; Windows ignores modes).
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const force = process.argv.includes('--force');
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'secrets');
mkdirSync(dir, { recursive: true, mode: 0o700 });

const hex = (n) => randomBytes(n).toString('hex');
const pgPassword = hex(24);
const user = process.env.POSTGRES_USER || 'aegis';
const db = process.env.POSTGRES_DB || 'aegischain';
const port = process.env.POSTGRES_PORT || '5432';

// name -> value. Hex passwords need no URL-encoding inside database_url.
const secrets = {
  postgres_password: pgPassword,
  database_url: `postgresql://${user}:${pgPassword}@localhost:${port}/${db}?schema=public`,
  minio_root_user: `aegis-${hex(4)}`,
  minio_root_password: hex(24),
  aegis_kek_v1: randomBytes(32).toString('base64'), // 32-byte AES-256 master key (KEK)
};

const written = [];
const skipped = [];
for (const [name, value] of Object.entries(secrets)) {
  const file = join(dir, name);
  if (existsSync(file) && !force) {
    skipped.push(name);
    continue;
  }
  writeFileSync(file, value, { mode: 0o600 });
  written.push(name);
}

console.log(`Secrets directory: ${dir}`);
console.log(`Written: ${written.join(', ') || '(none)'}`);
if (skipped.length) {
  console.log(`Skipped (already exist): ${skipped.join(', ')}`);
  console.log('Re-run with --force to regenerate ALL secrets (this invalidates existing');
  console.log('database/MinIO volumes and any data encrypted with the old KEK).');
}
console.log('Values were not printed. Never commit infra/secrets/.');
