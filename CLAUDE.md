# CLAUDE.md — AegisChain 2.0

Blockchain-backed identity and access control for engineering documents. Hackathon MVP: working, demonstrable security properties beat breadth.
This repo holds the **backend, chaincode, and infra only**. The React frontend is built separately by a teammate. Never create frontend code here.

## Read before changing anything
| Task touches | Read first |
|---|---|
| Any work | `docs/DEV_STATUS.md` (current milestone, decisions) |
| Module design, data placement, flows | `docs/ARCHITECTURE.md` |
| Endpoints, DTOs, errors | `docs/API_CONTRACT.md` (contract with the frontend) |
| Auth, crypto, access control, audit | `docs/THREAT_MODEL.md` (SR-xx requirements) |
| What to build next | `docs/IMPLEMENTATION_PLAN.md` |
Read only the relevant sections, not whole files, when a task is narrow.

## Stack
NestJS 11 + TypeScript (Node 22) · Prisma + PostgreSQL 16 · MinIO · Hyperledger Fabric 2.5 + Go chaincode (`fabric-contract-api-go`) via `@hyperledger/fabric-gateway` · `@simplewebauthn/server` · `otplib` · Node `crypto` (AES-256-GCM, SHA-256, HKDF) · Jest/Supertest · `go test` · Docker Compose (Fabric runs in WSL2).

## Layout
```
backend/src/modules/{auth,users,admin,assets,access,integrity,audit,security,crypto,storage,ledger}
backend/src/common/   config, filters, guards, pipes
backend/prisma/       schema + migrations (raw SQL allowed for triggers/grants)
chaincode/aegis/      Go chaincode
infra/                docker-compose.yml, fabric/, scripts/, secrets/ (git-ignored)
docs/                 design docs
```

## Architecture rules
- A single NestJS API is the only client of Postgres, MinIO, and Fabric. No microservices.
- All ledger access goes through the `LedgerService` interface (`memory` | `fabric`). DB→ledger writes go through the transactional outbox. Never call Fabric inside a DB transaction.
- Postgres is authoritative for live authorization decisions. The ledger is authoritative for hashes, ownership, and grant history.
- Keep `docs/API_CONTRACT.md` in sync with the code in the same change. Use the documented error format `{ error: { code, message, details, requestId } }`.
- Prefer small modules with a service holding the logic and a thin controller. No speculative features.

## Security rules (non-negotiable)
- **On-chain never:** document content, PII, passwords, TOTP secrets, keys (KEK/DEK/private keys), session tokens. On-chain only: ids, DIDs, SHA-256 hashes, ownership/grant/status records, audit anchors.
- Authorization is enforced server-side: global deny-by-default guards plus resource-level checks in services. `@Roles` alone is never enough for asset access. Never trust client-sent role, owner, status, or hash claims.
- Sessions are opaque and stored hashed. Cookie is `HttpOnly; Secure; SameSite=Strict`. CSRF header is required on mutations. The token rotates on every auth state change.
- WebAuthn challenges are single-use, expire after 5 min, and are bound to their purpose. TOTP rejects reused time-steps. TOTP secrets are encrypted and never returned after enrollment.
- Files use envelope encryption (per-version DEK, KEK from a secret, AAD = assetId|versionId). Never release plaintext before the GCM tag verifies. Downloads fail closed on integrity mismatch or when the ledger is unavailable.
- Revocation commits to the DB synchronously. Never claim revocation recalls already-downloaded copies.
- Never claim a DID proves real-world identity, or that ledger immutability proves content is truthful.
- The audit log is append-only and hash-chained. Never add UPDATE or DELETE paths for it.
- Never log keys, tokens, TOTP codes or secrets, or file contents.
- **The repo is public.** Never commit `.env`, keys, Fabric `organizations/` material, or real credentials. Use `.env.example` with placeholders.
- Validate all input with DTOs (`whitelist`, `forbidNonWhitelisted`). Rate-limit auth and download.

## Testing requirements
- Every milestone ships with tests for its acceptance criteria and its listed SR-xx IDs.
- Security behaviour (authz denials, replay, expiry, tamper) needs negative tests, not just happy paths.
- Unit: `npm test`. Integration/e2e: `npm run test:e2e` (needs `docker compose up -d`). Chaincode: `cd chaincode/aegis && go test ./...`.
- Never mark anything implemented or tested in `DEV_STATUS.md` without having run the tests and recorded the result.

## Workflow
- Work one milestone at a time. Stop at its acceptance criteria. Update `docs/DEV_STATUS.md` (completed work, evidence, next task).
- Don't install packages beyond what the current milestone lists without stating why.
- Ask before destructive git operations or pushes.

## Token-saving instructions
- Don't re-read files already read in this session unless they changed. Use Grep/Glob for targeted lookups.
- Read doc sections relevant to the task, not every doc.
- Don't print whole files in responses. Summarize changes and reference `path:line`.
- Don't spawn sub-agents unless the user asks.
- Keep responses short: what changed, test results, what's next.
