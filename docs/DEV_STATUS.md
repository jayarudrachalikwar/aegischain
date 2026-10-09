# AegisChain 2.0 — Development Status

_Last updated: 2026-10-09_

## Current phase
**M0 (repository and backend foundation): complete.** All acceptance criteria met and verified (details below). Files are staged for review; nothing is committed or pushed.

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

## Blockers
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
**M1 — Data model, RBAC core, and audit log** (see IMPLEMENTATION_PLAN.md). Start only after the M0 commit is approved and made.
