-- M3: TOTP enrollment, MFA login, step-up.
-- Adds TOTP state fields to users and MFA attempt counter to sessions.

ALTER TABLE users
  ADD COLUMN "totpSecret"        BYTEA,
  ADD COLUMN "totpPendingSecret" BYTEA,
  ADD COLUMN "totpEnrolled"      BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN "lastTotpStep"      BIGINT,
  ADD COLUMN "mfaFailedCount"    INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN "mfaWindowStart"    TIMESTAMPTZ;

ALTER TABLE sessions
  ADD COLUMN "mfaAttempts" INTEGER NOT NULL DEFAULT 0;
