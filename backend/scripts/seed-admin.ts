/**
 * One-time seed: creates the first ADMIN user and prints a single-use invite link.
 * Run with: npx ts-node -P tsconfig.json scripts/seed-admin.ts
 *
 * Requires DATABASE_URL in the environment (or set in infra/secrets/database_url).
 * The invite token is printed once and never stored in plaintext.
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function loadDatabaseUrl(): string {
  if (process.env['DATABASE_URL']) return process.env['DATABASE_URL'];
  try {
    return readFileSync('../infra/secrets/database_url', 'utf8').trim();
  } catch {
    console.error('DATABASE_URL not set and infra/secrets/database_url not found.');
    process.exit(1);
  }
}

async function main() {
  const url = loadDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl: url });

  try {
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existing) {
      console.error('An ADMIN user already exists. Use the API to create additional admins.');
      process.exit(1);
    }

    const email = process.env['ADMIN_EMAIL'];
    const displayName = process.env['ADMIN_NAME'] ?? 'Admin';
    if (!email) {
      console.error('Set ADMIN_EMAIL env var to the first admin email address.');
      process.exit(1);
    }

    const id = crypto.randomUUID();
    const did = `did:aegis:${id}`;

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id,
          email,
          displayName,
          role: 'ADMIN',
          status: 'ENROLLMENT_PENDING',
          did,
        },
      }),
      prisma.invite.create({
        data: {
          userId: id,
          createdById: id,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      }),
    ]);

    const baseUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    console.log(`\nAdmin user created: ${email}`);
    console.log(`DID: ${did}`);
    console.log(`\nOnboarding link (valid 48h, single-use):`);
    console.log(`  ${baseUrl}/onboard?token=${rawToken}\n`);
    console.log('Share this link securely. It will not be shown again.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
