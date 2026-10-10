-- M2: invites, WebAuthn credentials, and challenges

CREATE TYPE "ChallengeScope" AS ENUM ('REGISTER', 'LOGIN', 'ADD_PASSKEY');

-- Add lastLoginAt to users
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMPTZ;

-- Invites
CREATE TABLE "invites" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash"   TEXT        NOT NULL,
  "userId"      UUID        NOT NULL,
  "createdById" UUID        NOT NULL,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "usedAt"      TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "invites_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "invites_tokenHash_key"     UNIQUE ("tokenHash"),
  CONSTRAINT "invites_userId_key"        UNIQUE ("userId"),
  CONSTRAINT "invites_userId_fkey"       FOREIGN KEY ("userId")      REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "invites_createdById_fkey"  FOREIGN KEY ("createdById") REFERENCES "users"("id")
);

-- WebAuthn credentials
CREATE TABLE "webauthn_credentials" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "userId"       UUID        NOT NULL,
  "credentialId" TEXT        NOT NULL,
  "publicKey"    BYTEA       NOT NULL,
  "counter"      BIGINT      NOT NULL DEFAULT 0,
  "name"         TEXT,
  "aaguid"       TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastUsedAt"   TIMESTAMPTZ,

  CONSTRAINT "webauthn_credentials_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "webauthn_credentials_credentialId_key"  UNIQUE ("credentialId"),
  CONSTRAINT "webauthn_credentials_userId_fkey"       FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");

-- Challenges
CREATE TABLE "challenges" (
  "id"        UUID              NOT NULL DEFAULT gen_random_uuid(),
  "challenge" TEXT              NOT NULL,
  "scope"     "ChallengeScope"  NOT NULL,
  "userId"    UUID,
  "expiresAt" TIMESTAMPTZ       NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT "challenges_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "challenges_userId_idx" ON "challenges"("userId");
