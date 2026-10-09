# AegisChain 2.0 — Implementation Plan

Rules:
- One milestone per session or PR. A milestone is **done** only when its acceptance criteria pass and the completion evidence is recorded in `docs/DEV_STATUS.md`.
- `SR-xx` IDs refer to `docs/THREAT_MODEL.md`.
- Ordering: M0–M7 build a working backend on the in-memory ledger. M8 (chaincode) can run in parallel any time after M0. M9 swaps in real Fabric.

---

## M0 — Repository and backend foundation
- **Goal:** a runnable NestJS skeleton with config validation, error format, request IDs, a health check, and local Postgres and MinIO.
- **Files:** `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `README.md`, `infra/docker-compose.yml`, `infra/.env.example`, `infra/scripts/gen-secrets.sh`, `backend/` (Nest app: `main.ts`, `app.module.ts`, `config/` with env schema validation, `common/` with error filter, request-id middleware, validation pipe, and logger redaction), `backend/test/`, Prisma initialized with an empty schema.
- **Dependencies:** none. Needs Node 22, Docker Desktop, and the repo moved out of OneDrive (recommended).
- **Acceptance:** `docker compose up -d` starts healthy Postgres and MinIO. `npm run start:dev` serves `GET /api/v1/health` → `200` and `/health/ready` reports db and storage `up`. An invalid or missing env var fails startup with a clear message. Unknown routes return the contract error JSON with `requestId`. `.gitignore` covers `.env*`, `infra/secrets/`, `**/organizations/`, `node_modules`, and `dist`.
- **Tests:** unit tests for the config schema (rejects missing or short KEK; rejects `memory` ledger in production → SR-22) and the error filter shape. e2e test for health and the 404 format.
- **Evidence:** `npm test` and `npm run test:e2e` output, a `docker compose ps` healthy listing, and `git status` showing no secrets.

## M1 — Data model, RBAC core, and audit log
- **Goal:** users, roles, and sessions tables; global deny-by-default guards; a hash-chained append-only audit service.
- **Files:** `prisma/schema.prisma` (User, Session, AuditEvent), a raw SQL migration (audit triggers, restricted app role), `modules/auth/guards/*` (SessionGuard, CsrfGuard, RolesGuard, `@Public`, `@Roles`, `@CurrentUser`), `modules/audit/*`, `common/testing/session-factory.ts` (test-only).
- **Dependencies:** M0.
- **Acceptance:** all routes require a session unless marked `@Public`. Audit `append()` produces a valid chain. The app DB role cannot UPDATE or DELETE audit rows. `verifyChain()` detects a modified row.
- **Tests:** SR-01 (route enumeration), SR-06, SR-07, SR-17. Unit tests for hash canonicalization.
- **Evidence:** test output, plus a psql transcript showing the UPDATE being denied.

## M2 — Invites and passkey registration/login
- **Goal:** WebAuthn ceremonies per API §1 with single-use challenges, plus the CLI command that seeds the first admin.
- **Files:** `modules/auth/webauthn.*`, `modules/auth/challenge.*`, `modules/auth/session.service.ts`, Prisma models (Invite, WebAuthnCredential, Challenge), `scripts/seed-admin.ts`.
- **Dependencies:** M1. `@simplewebauthn/server`.
- **Acceptance:** an invite → register → `ENROLLMENT_PENDING` session works with a virtual or soft authenticator in tests. Login produces `MFA_PENDING`. Challenge reuse, expiry, and wrong purpose all fail.
- **Tests:** SR-03, SR-23 (auth rate limit). Integration tests with a software authenticator helper that generates real assertions.
- **Evidence:** test output, plus a manual check in a browser at `localhost` using Chrome's virtual authenticator (screenshot or log noted).

## M3 — TOTP enrollment, MFA login, step-up
- **Goal:** complete the auth state machine.
- **Files:** `modules/auth/totp.*`, `modules/crypto/kek.service.ts` (HKDF subkey for TOTP secrets), step-up guard `@RequireStepUp`.
- **Dependencies:** M2. `otplib`, `qrcode`.
- **Acceptance:** API §1 TOTP flows behave as specified. Lockout thresholds work. The session rotates on each transition.
- **Tests:** SR-02, SR-04, SR-05, SR-08, SR-18 (partial: TOTP codes and secrets not in logs).
- **Evidence:** test output.

## M4 — Profile and admin user management
- **Goal:** API §2–§4.
- **Files:** `modules/users/*`, `modules/admin/*`.
- **Dependencies:** M3.
- **Acceptance:** invite creation, role change, suspend/reactivate, and credential reset work, each with step-up, reason, and audit. Self-actions are blocked. Suspend kills sessions.
- **Tests:** SR-13 (role and self parts). Validation tests for every DTO.
- **Evidence:** test output.

## M5 — Crypto and storage services
- **Goal:** envelope encryption and a private MinIO storage adapter.
- **Files:** `modules/crypto/envelope.service.ts`, `modules/storage/minio.service.ts`, bucket bootstrap.
- **Dependencies:** M0 (independent of M2–M4).
- **Acceptance:** encrypt/decrypt round-trip. Wrong AAD, flipped bits, or the wrong KEK version fail. The bucket is created private.
- **Tests:** SR-16. Unit tests for IV uniqueness and tag failure. Integration test for put/get to MinIO.
- **Evidence:** test output.

## M6 — Assets (with in-memory ledger)
- **Goal:** API §5 upload/list/get/download plus the `LedgerService` interface, `InMemoryLedger`, and the outbox worker.
- **Files:** `modules/assets/*`, `modules/ledger/{ledger.service.ts, in-memory.ledger.ts, outbox.worker.ts}`, Prisma models (Asset, AssetVersion, LedgerOutbox).
- **Dependencies:** M3, M5. `file-type` for magic bytes.
- **Acceptance:** upload → PENDING → CONFIRMED via outbox. Owner download returns identical bytes. Non-owner gets 403/404. Tampered ciphertext gives 409 with no bytes released.
- **Tests:** SR-09, SR-14, SR-15, SR-21.
- **Evidence:** test output, plus a curl demo transcript.

## M7 — Access requests, grants, expiry, revocation
- **Goal:** API §7.
- **Files:** `modules/access/*`, Prisma models (AccessRequest, Grant), expiry sweep job.
- **Dependencies:** M6.
- **Acceptance:** the full lifecycle works. Approver eligibility and SoD rules are enforced. Revocation takes effect immediately. Expiry is checked live.
- **Tests:** SR-10 (policy matrix), SR-11, SR-12, SR-13 (self-approval).
- **Evidence:** test output, plus a policy matrix table in the test report.

## M8 — Go chaincode `aegis` (parallelizable after M0)
- **Goal:** ledger contract for identities, assets, transfers, grants, freezes, and audit anchors.
- **Files:** `chaincode/aegis/{go.mod, main.go, contract/*.go, contract/*_test.go}`.
- **Functions:** `RegisterIdentity`, `SetIdentityStatus`, `RegisterAsset`, `TransferAsset`, `SetAssetFrozen`, `RecordGrant`, `RevokeGrant`, `ExpireGrant`, `AnchorAudit`, `GetAsset`, `GetAssetHistory`, `GetGrant`, `GetAuditAnchor`.
- **Dependencies:** Go 1.22+, `fabric-contract-api-go` v2.
- **Acceptance:** all state-transition rules in ARCHITECTURE §7 hold. Caller MSP and attribute checks are in place. Tx timestamps are used.
- **Tests:** SR-19, SR-20 via `go test` with mocked transaction context and stub.
- **Evidence:** `go test ./... -cover` output.

## M9 — Fabric network and FabricLedger integration
- **Goal:** a real ledger behind `LedgerService`, plus reconciliation.
- **Files:** `infra/fabric/{network.sh, README.md}`, `backend/src/modules/ledger/fabric.ledger.ts`, `reconciliation.job.ts`, compose network wiring.
- **Dependencies:** M6, M7, M8. WSL2, `fabric-samples` 2.5 binaries, `@hyperledger/fabric-gateway`, `@grpc/grpc-js`.
- **Acceptance:** `network.sh up` deploys the chaincode. With `LEDGER_DRIVER=fabric`, an upload confirms with a real tx id and history returns ledger entries. Stopping the peer makes downloads return 503 and the outbox retry. Restarting recovers. Divergence raises an alert.
- **Tests:** integration suite tagged `@fabric`, run only when the network is up. The contract test suite runs against both ledger drivers.
- **Evidence:** test output plus `peer chaincode query` output for a registered asset.

## M10 — Integrity endpoints and audit anchoring
- **Goal:** API §6, §8 (`/audit/events`, `/audit/verify`), periodic `AnchorAudit`.
- **Dependencies:** M6 (memory) and M9 (fabric).
- **Acceptance:** verify returns MATCH or MISMATCH correctly. The client-hash check works. Anchors are written and verified. A rewritten audit row is detected.
- **Tests:** SR-15, SR-17 (anchor part).
- **Evidence:** test output.

## M11 — Security alerts and officer controls
- **Goal:** API §9 plus the alert rules from ARCHITECTURE §9.
- **Files:** `modules/security/*`.
- **Dependencies:** M7, M10.
- **Acceptance:** each alert rule fires in tests. Lock, freeze, and unfreeze work with step-up. Frozen assets cannot be downloaded.
- **Tests:** one test per alert rule. SR-13 (self-unlock), SR-21 (freeze).
- **Evidence:** test output.

## M12 — Frontend integration
- **Goal:** the teammate can integrate against a stable, documented API.
- **Files:** Swagger/OpenAPI generation, `scripts/seed-demo.ts` (demo users per role and sample assets), `docs/FRONTEND_INTEGRATION.md` (proxy config, CSRF, WebAuthn browser calls with `@simplewebauthn/browser`, error handling), CORS (disabled by default; proxy-only).
- **Dependencies:** M4–M11.
- **Acceptance:** the generated OpenAPI matches API_CONTRACT.md (diff reviewed). The demo seed runs. The teammate completes login → upload → request → approve → download → revoke against the local stack.
- **Tests:** e2e happy path across roles (supertest + soft authenticator).
- **Evidence:** e2e output plus a joint demo checklist.

## M13 — Hardening and demo readiness
- **Goal:** security headers (helmet), gitleaks pre-commit/CI, dependency audit, log redaction tests, threat-model re-check, demo script.
- **Tests:** SR-18, SR-24. Rerun the full SR matrix.
- **Evidence:** CI run link or output, plus an updated THREAT_MODEL residual-risk table.
