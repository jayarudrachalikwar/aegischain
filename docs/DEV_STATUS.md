# AegisChain 2.0 — Development Status

_Last updated: 2026-10-09_

## Current phase
**M2 (WebAuthn registration + login): complete.** All acceptance criteria met and verified (details below).

---

## Frontend integration status (updated 2026-10-09)
- Frontend PR #1 merged (`main` = `128821c` + local alignment edits, **uncommitted**). `npm ci`, `tsc -b`, `oxlint` (0 errors, 107 warnings) and `vite build` pass. **Not verified in a browser** (Chrome extension unavailable); no frontend tests exist.
- Aligned with our design: Fabric wording (no Besu/IBFT/contract address), no organization branding, 5 roles, INTERNAL/CONFIDENTIAL/RESTRICTED classifications (user "clearance" removed), role-to-screen rules per `API_CONTRACT.md` (`frontend/src/config/access.ts`), signed-out start + `RequireRole` guard (UX only), visible "simulated data" banner, honest README, contract-style transport (`http()`: same-origin `/api/v1`, cookies, CSRF header, contract errors) and Vite dev proxy.
- Bug fixed: seeded demo assets had fake stored hashes, so integrity verification always failed; hashes are now the real SHA-256 of the sample content.
- Still simulated: passkeys, TOTP (any 6 digits), encryption, blockchain panel numbers, all lists. Demo mode remains the default and never calls the backend.
- Still to do (M12): endpoint/shape mapping to `API_CONTRACT.md` (table in `docs/FRONTEND_INTEGRATION.md`); global lockdown has no contract equivalent (decision needed); mock sample documents still use radar/EW themes (fictional).
- Evaluation material: `docs/EVALUATION_GUIDE.md`, `docs/DEMO_SCRIPT.md`.

## Repository state
- Local git repo (`main`), remote `origin` = https://github.com/jayarudrachalikwar/aegischain (**public**, empty). Nothing staged, committed or pushed.
- Local path is under OneDrive (recommend moving before heavy use).

## M0 — what was done
- `.gitignore` (written first), `.gitattributes`, `.nvmrc`, `README.md`.
- `infra/docker-compose.yml` (Postgres 16.9-alpine + MinIO; file-based Docker secrets; ports bound to 127.0.0.1; healthchecks; named volumes), `infra/.env.example`, `infra/scripts/gen-secrets.mjs` (CSPRNG, 0600 where supported, never prints values, never overwrites without `--force`).
- `backend/`: NestJS 11 + TypeScript 5.9, zod config validation (`*_FILE` secrets supported, errors name variables never values), contract error format via `AllExceptionsFilter`, request IDs (`X-Request-Id`, unsafe client ids replaced), `GET /api/v1/health` and `GET /api/v1/health/ready`, Prisma 7.10 with an empty schema (`prisma.config.ts`, driver adapter `@prisma/adapter-pg`), ESLint/Prettier, Jest unit + e2e.
- `docs/API_CONTRACT.md` §10 updated: readiness lives at `/api/v1/health/ready`, returns `{db, storage}` only (`ledger` arrives with M6/M9).

## Validation actually performed (2026-10-09, after MinIO fix)
| Check | Result |
|---|---|
| `format:check`, `lint`, `typecheck` | pass (`src/generated` excluded from Prettier via `.prettierignore`) |
| `npm test` | 3 suites, **27 passed** |
| `npm run test:e2e` | **14 passed**, 1 skipped (opt-in real-infra suite) |
| `E2E_REAL_INFRA=1 npm run test:e2e` | **2 suites, 15 passed** (readiness against real Postgres + MinIO) |
| `docker compose up -d` | postgres **healthy**, minio **healthy** (ports 127.0.0.1:55432, 9000, 9001 only) |
| MinIO health probe negative test | probe exits 1 for a non-ready path (it tests HTTP 200 from `/minio/health/ready`) |
| MinIO credentials | file-secret credentials accepted, wrong password rejected, anonymous request → 403; container runs as uid 65532 |
| Built app vs real infra | `/api/v1/health` 200; `/api/v1/health/ready` 200 `{"db":"up","storage":"up"}`; unknown route → contract 404 JSON with requestId |
| Invalid config startup | exits 1, lists LEDGER_DRIVER (SR-22) / DATABASE_URL / AEGIS_KEK_V1 problems, no values printed |
| Git secret scan | no secrets, keys, `.env`, volumes or generated client visible to git |

Defects found and fixed during M0 validation: framework error text (JSON parse details) echoed to clients; SR-22 check hidden behind other config errors; Nest stack trace on config errors; Prettier flagging generated Prisma files.

## MinIO image (resolved blocker)
- Source: `cgr.dev/chainguard/minio` (Chainguard, distroless, non-root). `chainguard/minio` on Docker Hub resolved to the identical digest.
- Pinned by digest in `infra/docker-compose.yml`: `sha256:f74600a1a46330cdbda1ef760d17a96bd6e0f4a6f0a2c49792ca3ee7e4c6fa18` = MinIO `RELEASE.2026-09-22T19-25-18Z` (pulled 2026-10-09). Digest was read from the actual pull, not assumed. Cosign signature was **not** verified (cosign not installed); the procedure is in `infra/README.md`.
- Image facts: ENTRYPOINT `/usr/bin/minio`, user 65532, no built-in HEALTHCHECK, no curl/wget; has `bash`, which the compose health probe uses. `MINIO_ROOT_*_FILE` secrets are supported.
- Refresh/verify procedure: `infra/README.md` ("Verifying the current pin", "Refreshing the pin").
- Caveat: third-party rebuild of an archived upstream project. Dev use only; re-evaluate before production. App code is S3-generic (nothing depends on MinIO until M5).

## M1 — what was done

### Schema and migration
- Prisma schema: added `UserRole`, `UserStatus`, `SessionState` enums; `User`, `Session`, `AuditEvent` models (mapped to `users`, `sessions`, `audit_events`).
- Migration `20261009000000_m1_rbac_and_audit/migration.sql`: full DDL, FK constraints, indexes, audit-immutability trigger (`protect_audit_events()` blocks UPDATE/DELETE/TRUNCATE), `aegis_app` NOLOGIN role with INSERT+SELECT only on `audit_events`.
- Applied cleanly after a `DROP SCHEMA public CASCADE` reset (dev DB had leftover tables from a prior copy; not a migration bug).

### Guards and decorators (`backend/src/modules/auth/guards/`)
- `SessionGuard`: reads `aegis_sid` cookie, hashes with SHA-256, DB lookup, validates ACTIVE state + expiry (idle and absolute), rejects SUSPENDED/LOCKED users, refreshes idle timer, injects `req.user` + `req.session`.
- `CsrfGuard`: skips @Public and non-mutating methods; compares `aegis_csrf` cookie to `X-CSRF-Token` header with `timingSafeEqual`.
- `RolesGuard`: reads `@Roles(...)` metadata; throws 403 if user role not in set.
- `@Public()`, `@Roles(...)`, `@CurrentUser` decorators.
- All three guards registered as `APP_GUARD` in `AuthModule` (global, ordered: Session → CSRF → Roles).
- `cookie-parser` middleware added to `configure-app.ts`.
- `@Public()` applied to `HealthController` (class-level).

### Audit service (`backend/src/modules/audit/`)
- `AuditService.append()`: serialized with `pg_advisory_xact_lock(17349, 82901)`, SHA-256 hash over canonicalized row (sorted keys, ISO dates), links `prevHash` to previous row.
- `AuditService.verifyChain()`: recomputes every hash and checks linkage; reports `firstBrokenSeq`.
- `canonicalizeAuditRow` / `computeAuditHash` exported for unit testing.

### Test helpers
- `backend/src/common/testing/session-factory.ts`: creates User + Session in DB, returns raw token, CSRF token, cookie header.

### M1 validation (2026-10-09)
| Check | Result |
|---|---|
| `format:check` | **pass** — all files clean |
| `lint` | **pass** — 0 errors |
| `typecheck` | **pass** — 0 errors |
| `npm test` | **6 suites, 57 tests passed** |
| `npm run test:e2e` (no real infra) | **2 suites, 19 passed**; 7 skipped (real-infra gate) |
| `E2E_REAL_INFRA=1 npm run test:e2e` | **7 SR-17 tests passed** (audit chain, tamper detection, trigger enforcement) |

SR coverage: SR-01 (deny-by-default route enumeration), SR-06 (CSRF), SR-07 (token hash), SR-17 (audit chain integrity).

### Decisions (M1)
| # | Decision |
|---|---|
| D17 | Prisma-generated client path is `src/generated/prisma/client` (not a directory index; Prisma 7 generates `client.ts` directly) |
| D18 | `AuditEventUncheckedCreateInput` used for audit appends to allow direct `actorId` field |
| D19 | `HashableRow` interface (details: unknown) used for hash computation to avoid Prisma JSON type conflicts |
| D20 | Advisory lock key `(17349, 82901)` serializes audit appends within a transaction |

## M2 — what was done

### Schema and migration
- Prisma schema: added `ChallengeScope` enum (`REGISTER`, `LOGIN`, `ADD_PASSKEY`); `Invite`, `WebAuthnCredential`, `Challenge` models; `lastLoginAt` column on `User`.
- Migration `20261009000001_m2_invites_webauthn_challenges/migration.sql`: DDL for all 3 new tables + `ALTER TABLE users ADD COLUMN "lastLoginAt"`.
- Migration applied cleanly to dev DB.

### Services
- **`ChallengeService`** (`auth/challenge.service.ts`): generates/stores 32-byte random challenges (base64url), consumes atomically (checks scope, single-use, 5-min TTL). Accepts pre-generated challenge bytes so controller can pass same bytes to simplewebauthn.
- **`SessionService`** (`auth/session.service.ts`): creates/rotates/destroys sessions; sets `aegis_sid` (HttpOnly, Secure, SameSite=Strict) and `aegis_csrf` (httpOnly:false) cookies; 30-min idle / 8-h absolute TTL (5-min for MFA_PENDING).
- **`WebAuthnService`** (`auth/webauthn.service.ts`): wraps `@simplewebauthn/server` v14 for registration and authentication ceremonies; takes `challengeBytes: Uint8Array<ArrayBuffer>` (generated by controller) to ensure DB and library see the same challenge.

### Controller
- **`AuthController`** (`auth/auth.controller.ts`): 6 endpoints per API §1 — `GET /session`, `POST /register/options` (200), `POST /register/verify` (201), `POST /login/options` (200), `POST /login/verify` (200), `POST /logout` (204).
- `@Throttle({ auth: { limit: 10, ttl: 60_000 } })` on `register/options` and `login/options` (SR-23).
- `ThrottlerGuard` registered as `APP_GUARD` in `AppModule`.

### Auth module
- `AuthModule` imports `AuditModule`; exports `ChallengeService`, `WebAuthnService`, `SessionService`.
- `configure-app.ts`: global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`.

### Seed script
- `scripts/seed-admin.ts`: creates first ADMIN user + invite; reads DB URL from env or `infra/secrets/database_url`; requires `ADMIN_EMAIL` env var; prints one-time onboarding link.

### M2 validation (2026-10-09)
| Check | Result |
|---|---|
| `format` | **pass** — 0 changes |
| `lint` | **pass** — 0 errors |
| `typecheck` | **pass** — 0 errors |
| `npm test` | **7 suites, 65 tests passed** |
| `npm run test:e2e` (no real infra) | **19 passed, 3 skipped** (real-infra gate) |
| `E2E_REAL_INFRA=1 npm run test:e2e` | **30/31 passed** (1 skip: MinIO port conflict, pre-existing) |
| WebAuthn SR-03 tests | **5/5 passed**: registration ceremony, login ceremony, challenge reuse rejected, used invite rejected, wrong-scope challenge rejected |
| Audit SR-17 tests | **6/6 passed** |

SR coverage added: SR-03 (challenge single-use + expiry + scope binding), SR-23 (auth rate limiting 10 req/min).

### Key bugs fixed (M2)
| Bug | Root cause | Fix |
|---|---|---|
| Challenge mismatch (always 401) | Controller called `generateRegistrationOptions` which generated its own challenge; DB stored a different one | Generate challenge in `ChallengeService.create()` first, pass same `Uint8Array` bytes to simplewebauthn |
| `register/options` returning 201 | NestJS defaults all POST handlers to 201 (CREATED) | Added `@HttpCode(200)` decorator |
| Invalid JWK EC key on login verify | `buildCoseKey()` in soft authenticator extracted x/y at wrong SPKI offset (27 vs 26 for the uncompressed-point `04` prefix byte) | Fixed: `x = spki.subarray(27, 59)`, `y = spki.subarray(59, 91)` |
| Audit tests: authentication failed | `audit.e2e-spec.ts` fallback URL was `postgres:postgres@postgres` (wrong user/db/pass) | Updated to `aegis:aegis_dev_only@aegischain` |
| Audit test isolation: stale deadbeef rows | `deleteMany` hit DELETE trigger, `.catch()` swallowed silently | `afterEach` now disables triggers, deletes, re-enables |

### Decisions (M2)
| # | Decision |
|---|---|
| D21 | Challenge bytes are generated once in `ChallengeService` and passed to simplewebauthn — never let simplewebauthn generate its own challenge |
| D22 | `ThrottlerGuard` registered in `AppModule` (not `AuthModule`) so it executes before session/CSRF guards |
| D23 | `@SkipThrottle()` on the whole `AuthController` class; `@Throttle(...)` re-enables on specific endpoints — avoids accidental rate-limiting of unrelated auth routes |

## Blockers
None for M1 or M2.

### Known environment limitation (pre-existing)
- Port 9000 is occupied by another Docker project; MinIO container cannot start. This causes 1 test to fail in `infra.e2e-spec.ts` (`E2E_REAL_INFRA=1`). Not a code regression; all M1/M2 tests pass without MinIO.

## M0 blockers (resolved)
None for M0.

## Environment limitations / notes
- Host ports 5432 and 5433 are taken on this machine; dev Postgres uses **55432** (git-ignored `infra/.env`; secrets generated with `POSTGRES_PORT=55432`).
- Prisma CLI pulls dev-only transitive audit findings (`mysql2`, `deepmerge-ts`: 4 high) plus moderate jest-tooling ones. No runtime dependency affected; not downgraded.
- Repo is under OneDrive (recommend relocating). Docker Desktop had to be started manually.

## Decisions made (additions to Phase 1 list)
| # | Decision |
|---|---|
| D12 | Prisma 7.10 (stable; `latest` tag was an 8.0 RC) with TypeScript pinned to 5.9 (ts-jest needs <7) |
| D13 | Framework `HttpException` text is never returned to clients; only `ApiException` carries custom messages |
| D14 | Health endpoints live under `/api/v1`; readiness body is `{db, storage}` in M0 |
| D16 | MinIO via digest-pinned Chainguard image; storage code stays S3-generic |
| D15 | Secrets generator is Node (`gen-secrets.mjs`), not bash, for Windows/Linux parity |

## Next exact task
**M3 — TOTP enrollment and step-up authentication** (see IMPLEMENTATION_PLAN.md).
