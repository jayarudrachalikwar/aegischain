-- M1: users, sessions, audit_events
-- Prisma-generated DDL + custom audit protection and app DB role.

-- CreateEnum
CREATE TYPE "UserRole"    AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER');
CREATE TYPE "UserStatus"  AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED', 'ENROLLMENT_PENDING');
CREATE TYPE "SessionState" AS ENUM ('ENROLLMENT_PENDING', 'MFA_PENDING', 'ACTIVE');

-- CreateTable: users
CREATE TABLE "users" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "email"       TEXT         NOT NULL,
    "displayName" TEXT         NOT NULL,
    "department"  TEXT,
    "role"        "UserRole"   NOT NULL DEFAULT 'EMPLOYEE',
    "status"      "UserStatus" NOT NULL DEFAULT 'ENROLLMENT_PENDING',
    "did"         TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE "sessions" (
    "id"         UUID           NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash"  TEXT           NOT NULL,
    "userId"     UUID           NOT NULL,
    "state"      "SessionState" NOT NULL DEFAULT 'MFA_PENDING',
    "stepUpAt"   TIMESTAMP(3),
    "idleAt"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "absoluteAt" TIMESTAMP(3)   NOT NULL,
    "expiresAt"  TIMESTAMP(3)   NOT NULL,
    "createdAt"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_events
CREATE TABLE "audit_events" (
    "seq"        BIGSERIAL    NOT NULL,
    "ts"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId"    UUID,
    "actorRole"  TEXT,
    "action"     TEXT         NOT NULL,
    "targetType" TEXT,
    "targetId"   TEXT,
    "outcome"    TEXT         NOT NULL,
    "ip"         TEXT,
    "userAgent"  TEXT,
    "requestId"  TEXT,
    "details"    JSONB,
    "prevHash"   TEXT,
    "hash"       TEXT         NOT NULL,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("seq")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key"        ON "users"("email");
CREATE UNIQUE INDEX "users_did_key"          ON "users"("did");
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE        INDEX "sessions_userId_idx"    ON "sessions"("userId");

-- AddForeignKey
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_events"
    ADD CONSTRAINT "audit_events_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit append-only protection (SR-17)
-- Trigger fires for all roles including superusers. In production the aegis_app role
-- also lacks UPDATE/DELETE grants, providing defence in depth.
CREATE OR REPLACE FUNCTION protect_audit_events()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only: % is not permitted', TG_OP;
END;
$$;

CREATE TRIGGER audit_no_update
    BEFORE UPDATE ON "audit_events"
    FOR EACH ROW EXECUTE FUNCTION protect_audit_events();

CREATE TRIGGER audit_no_delete
    BEFORE DELETE ON "audit_events"
    FOR EACH ROW EXECUTE FUNCTION protect_audit_events();

CREATE TRIGGER audit_no_truncate
    BEFORE TRUNCATE ON "audit_events"
    FOR EACH STATEMENT EXECUTE FUNCTION protect_audit_events();

-- Application DB role (aegis_app)
-- Dev connects as the postgres superuser; the trigger enforces audit immutability.
-- Production: connect as aegis_app (set DATABASE_URL accordingly).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'aegis_app') THEN
        CREATE ROLE aegis_app NOLOGIN;
    END IF;
END;
$$;

GRANT USAGE ON SCHEMA public TO aegis_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users"        TO aegis_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "sessions"     TO aegis_app;
GRANT SELECT, INSERT                 ON "audit_events" TO aegis_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public  TO aegis_app;
