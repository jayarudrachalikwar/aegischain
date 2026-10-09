# AegisChain 2.0 — Architecture

Status: **Design (Phase 1)**. Nothing in this document is implemented yet unless `docs/DEV_STATUS.md` says so.

## 1. Goals and non-goals

**Goals (hackathon MVP):** passkey + TOTP login, role-based access to encrypted engineering documents, NFT-like ownership records and grant history on Hyperledger Fabric, SHA-256 integrity verification against the ledger, tamper-evident audit log, security alerts, and a stable REST contract for the separately built React frontend.

**Non-goals:** real-world identity proofing (KYC), public blockchain or tokens, client-side end-to-end encryption, multi-tenant SaaS, microservices, DRM. Once an authorized user has downloaded plaintext, the platform cannot control it.

## 2. Stack evaluation

| Component | Verdict | Notes / trade-offs |
|---|---|---|
| Node.js 22 LTS + TypeScript + NestJS 11 | Keep | Guards, interceptors, and DI suit RBAC and audit cross-cutting concerns. |
| Hyperledger Fabric 2.5 LTS + Go chaincode (`fabric-contract-api-go`) | Keep, with a caveat | Use **`@hyperledger/fabric-gateway`** (the Gateway SDK). Do not use the deprecated `fabric-network` SDK. Problem: Fabric's local tooling (`fabric-samples/test-network`) is bash- and Docker-based, so on this Windows machine it must run in **WSL2 with Docker Desktop**. Mitigation: the backend talks to the ledger through a `LedgerService` interface with an in-memory driver, so backend work is never blocked on Fabric. |
| PostgreSQL 16 + Prisma | Keep (Prisma chosen as ORM) | Raw SQL migrations are still needed for audit-table triggers and grants. Prisma supports this. |
| MinIO | Keep | Private bucket. Only the API can reach it. No presigned URLs are given to clients (see §5). |
| WebAuthn (`@simplewebauthn/server`) + TOTP (`otplib`) | Keep | WebAuthn needs a secure context. `localhost` qualifies for development. Production needs HTTPS. |
| AES-256-GCM, SHA-256 (Node `crypto`) | Keep | No third-party crypto libraries. |
| Docker Compose | Keep | Postgres, MinIO, and the API run in Compose. The Fabric network runs from its own scripts on a shared Docker network. |
| Jest + Supertest; `go test` | Keep | Integration tests use Compose-provided Postgres and MinIO. |

**Environment issues (not stack problems):**
1. The repo currently lives under **OneDrive**. Syncing `node_modules`, Postgres volumes, and Fabric crypto material through OneDrive is slow and causes file-lock errors. Recommendation: move the clone to a non-synced path, ideally the WSL2 filesystem (`~/src/aegischain`).
2. The GitHub repo is **public**. Secrets and generated crypto material (`.env`, Fabric `organizations/`, keys) must be git-ignored from the first commit.

## 3. Components

```
 React SPA (teammate, Antigravity)
        │ HTTPS, same-origin via dev proxy, cookie session + CSRF header
        ▼
 ┌───────────────────── NestJS API (single deployable) ─────────────────────┐
 │ AuthModule     WebAuthn ceremonies, TOTP, sessions, step-up              │
 │ UsersModule    profile, admin user management, invites                   │
 │ AssetsModule   upload / list / metadata / download / ownership            │
 │ AccessModule   requests, approvals, grants, expiry, revocation           │
 │ IntegrityModule  hash verification vs ledger                             │
 │ AuditModule    hash-chained append-only log + anchoring                  │
 │ SecurityModule alert rules, alert triage, lock/freeze controls           │
 │ CryptoModule   envelope encryption (KEK → per-version DEK)               │
 │ StorageModule  MinIO client (private bucket)                             │
 │ LedgerModule   LedgerService: FabricLedger | InMemoryLedger; outbox      │
 └───────┬───────────────────────┬───────────────────────────┬──────────────┘
         │ SQL (TLS in prod)     │ S3 API (internal net)     │ gRPC/TLS (Gateway)
         ▼                       ▼                           ▼
   PostgreSQL               MinIO (ciphertext)      Fabric peer → chaincode `aegis`
   users, sessions,         objects keyed by        on channel `aegischannel`
   grants, audit, outbox    random UUID
```

Responsibilities:
- **Frontend:** UI only. Role checks there are cosmetic and are **not** security controls.
- **API:** the single policy enforcement point. It owns sessions, authorization, crypto, and orchestration. It is the only client of Postgres, MinIO, and Fabric.
- **PostgreSQL:** the system of record for accounts, sessions, asset metadata, wrapped keys, requests and grants (the authoritative source for live access decisions), audit log, alerts, and the ledger outbox.
- **MinIO:** stores ciphertext only.
- **Fabric chaincode:** the trusted record of asset registration (owner DID, SHA-256 per version), ownership transfers, grant issuance and revocation history, identity status, and audit anchors. It enforces state-transition rules.

## 4. Identity, authentication, and authorization

### 4.1 Identity
- Each user has an internal UUID and a platform-issued pseudonymous **DID** (`did:aegis:<uuid>`). The DID is registered on-chain with a status (ACTIVE/SUSPENDED). It contains no PII.
- A DID proves only that a **platform account vetted by an admin invite** exists. It does **not** prove real-world identity. Identity vetting happens out of band when an ADMIN creates the invite.
- Onboarding is invite-only. There is no public sign-up. The first ADMIN is created by a one-time CLI seed command that prints a single-use invite link.

### 4.2 Roles (one role per user in the MVP)

| Role | Can | Cannot |
|---|---|---|
| EMPLOYEE | Upload own assets, request access, download owned or granted assets, revoke grants on own assets | View others' audit trails |
| MANAGER | Everything EMPLOYEE can, plus approve or deny requests for assets in their department | Approve their own requests |
| ADMIN | Create, suspend, and reactivate users; change roles (not their own); reset credentials | Download documents without a grant; edit or delete audit; approve access |
| AUDITOR | Read audit log, verify the audit chain, verify asset integrity, read all asset metadata | Download content, change any state |
| SECURITY_OFFICER | Triage alerts, lock users, freeze assets, revoke any grant, read audit | Change roles, download without a grant |

Separation of duties: no self-approval, no self role change, and no self-unlock. Every privileged action raises an audit event, and some also raise an alert.

### 4.3 Sessions
- The session is an opaque 256-bit random token in cookie `aegis_sid` with `HttpOnly; Secure; SameSite=Strict; Path=/api`. Only its SHA-256 hash is stored in the `sessions` table. Sessions are server-side rather than JWTs so that revocation takes effect immediately.
- Session states: `ENROLLMENT_PENDING` (passkey registered, TOTP not yet enrolled), `MFA_PENDING` (passkey verified, TOTP not yet entered), and `ACTIVE`. Non-ACTIVE sessions can call only the endpoints for the next step.
- Timeouts: 30-minute idle timeout, 8-hour absolute lifetime, and 5-minute lifetime for pending states. The token rotates on every state change. Suspending a user deletes all of their sessions.
- **CSRF:** `SameSite=Strict` plus a double-submit token. The `aegis_csrf` cookie is readable by JS, and its value must be echoed in the `X-CSRF-Token` header on every state-changing request.
- **Step-up:** sensitive operations (role change, credential reset, ownership transfer, passkey removal, grant approval) require a TOTP re-verification made within the last 5 minutes (`session.stepUpAt`).

### 4.4 Login flow
1. `POST /auth/login/options`: the server creates a 32-byte challenge and stores it with purpose `LOGIN`, a 5-minute expiry, and `consumed_at = NULL`. It returns the options and a `challengeId`.
2. The browser runs `navigator.credentials.get()`.
3. `POST /auth/login/verify`: the server atomically consumes the challenge (`UPDATE … WHERE consumed_at IS NULL AND expires_at > now() RETURNING`). It then verifies the origin, RP ID, signature, `userVerification=required`, and sign counter, and creates an `MFA_PENDING` session.
4. `POST /auth/mfa/verify`: the server verifies the TOTP code (±1 step). It rejects any time-step ≤ `last_used_step`, which prevents replay. The session becomes `ACTIVE` with a rotated token.

### 4.5 Authorization pipeline (every request)
`SessionGuard` (valid, active, not expired, user not suspended or locked) → `CsrfGuard` (mutating methods) → `RolesGuard` (`@Roles(...)`) → service-level **resource checks** (ownership, department, grant validity). Role checks alone are never sufficient for asset access. All denials are audited.

## 5. Asset upload, encryption, and download

### 5.1 Key hierarchy (envelope encryption)
- **KEK:** a 32-byte master key loaded from a secret (`AEGIS_KEK_V1`, from a Docker secret or env in development; KMS or Vault in production). It is versioned (`kek_version`) so keys can be rewrapped.
- **DEK:** a random 32-byte key per asset **version**. It is wrapped with AES-256-GCM under the KEK, and only the wrapped form (`wrapped_dek`, `dek_iv`, `dek_tag`, `kek_version`) is stored in Postgres.
- A separate HKDF-derived subkey of the KEK (info `"totp-secret"`) encrypts TOTP secrets.
- Neither the KEK nor any plaintext DEK is ever logged, returned by the API, stored in MinIO, or sent on-chain.

### 5.2 Upload
1. Authenticated `ACTIVE` session plus CSRF. Multipart upload with a size limit of 25 MB (MVP, configurable).
2. Validation: filename sanitized; extension **and** magic bytes checked against an allowlist (pdf, png, jpg, txt, csv, dxf, step/stp, stl). Archives and executables are rejected.
3. Compute SHA-256 over the **plaintext**.
4. Generate the DEK and a 12-byte IV. Encrypt with AES-256-GCM using AAD = `assetId|versionId` so ciphertexts cannot be swapped between objects.
5. `PUT` the ciphertext to MinIO under the key `assets/<random-uuid>`. The object key carries no user-supplied names.
6. A single DB transaction inserts the `asset` and `asset_version` rows (`chain_status=PENDING`), a `ledger_outbox` row (`RegisterAsset`), and an audit event.
7. The outbox worker submits `RegisterAsset(assetId, versionId, ownerDid, sha256, metaHash)` to Fabric. On commit it stores `tx_id` and sets `chain_status=CONFIRMED`. Retries use exponential backoff. After N failures it sets `chain_status=FAILED` and raises an alert.
8. The response is `201` with `chainStatus: "PENDING"`. The asset **cannot be downloaded until CONFIRMED**, because integrity can only be checked against a confirmed ledger hash.

### 5.3 Download
1. `GET /assets/:id/download`. Authorization requires an active user, an asset that is not frozen, a CONFIRMED version, and either ownership or a grant with `status=ACTIVE AND revoked_at IS NULL AND expires_at > now()`. Expiry is evaluated **at request time**, not by a cron job.
2. Fetch the ciphertext, unwrap the DEK, decrypt, and verify the GCM tag. Plaintext is never released before the tag is verified, which is why the MVP decrypts whole files in memory within the size limit.
3. Recompute SHA-256 and compare it with the ledger hash (`LedgerService.getAsset`). On a mismatch or tag failure, return `409 INTEGRITY_FAILURE`, raise a CRITICAL alert, and release nothing. If the ledger is unreachable, the download **fails closed** with `503 LEDGER_UNAVAILABLE` (configurable for demos only).
4. Write an audit event. Respond with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, and `X-Aegis-SHA256`.

Clients never receive presigned MinIO URLs. Every byte goes through the authorization check.

### 5.4 Integrity verification
- **Server-side check:** decrypt the stored object, hash it, and compare against the ledger. Returns MATCH or MISMATCH plus the ledger tx id.
- **Client-side check:** the frontend hashes a local file with WebCrypto and sends only the hash. The server compares it with the ledger record. Use this to confirm that "the file I hold is the registered version."
- Scope: a MATCH proves the bytes are unchanged since registration. It does **not** prove that the registered content was truthful or correct.

## 6. Access request → approval → expiry → revocation

```
EMPLOYEE ──POST /access-requests──▶ PENDING ──approve (step-up)──▶ APPROVED → Grant ACTIVE
                                       │                                  │ expires_at passes → EXPIRED (on next check / sweep)
                                       ├─deny──▶ DENIED                   │ revoke → REVOKED (immediate, terminal)
                                       └─cancel─▶ CANCELLED
```
- **Eligible approvers:** the asset owner, or a MANAGER in the asset's department. Requesters cannot approve their own requests, and an approver cannot be the grantee. The maximum duration is 30 days (configurable).
- **Approval** creates a `grant` in Postgres in the same transaction as the request update, the outbox row `RecordGrant`, and the audit event.
- **Revocation** (by the owner, the approving manager, or a SECURITY_OFFICER) sets `REVOKED` in Postgres **immediately**. That alone blocks future downloads. `RevokeGrant` goes to the ledger through the outbox, and revocation never waits on the chain.
- **Expiry:** downloads check `expires_at` live. A periodic sweep marks grants EXPIRED and records the change on-chain for history.
- **Limitation:** revocation and expiry stop *future* downloads. Copies already downloaded cannot be recalled.

## 7. On-chain vs off-chain

| Data | Location | Reason |
|---|---|---|
| Document plaintext and ciphertext | MinIO (ciphertext only) | Confidentiality, size |
| DEKs (wrapped), KEK | Postgres (wrapped) / secret store | Keys never go on-chain |
| Passwords | None (passwordless) | — |
| TOTP secrets | Postgres, encrypted | Never on-chain |
| Passkey public keys, sign counters | Postgres | Not needed on-chain |
| Names, emails, departments (PII) | Postgres | GDPR-style erasure is impossible on a ledger |
| DID + status | **Ledger** | Pseudonymous identity anchor |
| Asset id, version id, owner DID, SHA-256, metadata hash, registration time | **Ledger** | Integrity and ownership provenance |
| Ownership transfers | **Ledger** (+ Postgres mirror) | NFT-like provenance |
| Grant issue / revoke / expire records (ids, DIDs, expiry) | **Ledger** (+ Postgres, authoritative for live decisions) | Tamper-evident access history |
| Audit events | Postgres (hash-chained) | Volume and PII |
| Audit chain head hash (periodic anchor) | **Ledger** | Detects audit rewrites |

**Consistency:** Postgres writes and ledger submissions are linked through a **transactional outbox**. A reconciliation job (on startup, then every 10 minutes) compares Postgres records with ledger state and raises an alert on any divergence. The ledger is authoritative for hashes and ownership history. Postgres is authoritative for live authorization. A divergence never silently "fixes" the ledger.

**Chaincode trust model (stated plainly):** the API submits every transaction under a single organization client identity. Chaincode therefore cannot cryptographically verify *which end user* acted. It trusts the API's assertion of the actor DID. Chaincode does enforce the following: the caller's MSP is `AegisOrgMSP` with cert attribute `aegis.role=api`; ids cannot be overwritten; hashes are immutable per version; only the recorded owner DID can be the `from` of a transfer; a grant must reference an existing asset; `expiresAt` must be later than the tx timestamp; revocation is terminal; and timestamps come from the transaction, not from arguments. Per-user Fabric identities are future work.

## 8. Audit log
- Table `audit_events(seq bigserial, ts, actor_id, actor_role, action, target_type, target_id, outcome, ip, user_agent, request_id, details jsonb, prev_hash, hash)`.
- `hash = SHA-256(canonical_json(row without hash) || prev_hash)`. Inserts are serialized with a Postgres advisory lock.
- The application DB role has only `INSERT, SELECT` on this table, and a trigger rejects `UPDATE`/`DELETE`/`TRUNCATE`. A DB superuser can still bypass this, which is why anchoring exists.
- **Anchoring:** every 100 events or every 5 minutes, `AnchorAudit(seq, headHash)` is written to the ledger. `GET /audit/verify` recomputes the chain and checks every anchor.
- **Residual risk:** events written after the last anchor can be truncated undetectably by a DB superuser.

## 9. Security alerts (rule-based, in-process)
Alert rules: ≥5 failed MFA attempts in 10 minutes (the user is locked at 10 in 1 hour), ≥5 authorization denials on assets in 10 minutes, any integrity mismatch (CRITICAL), ledger divergence or outbox FAILED, audit chain break (CRITICAL), privileged role granted, credential reset, admin acting on a security-relevant target, and a grant approved for maximum duration on a RESTRICTED asset. Alerts are rows in `security_alerts` with severity, status (OPEN/ACKNOWLEDGED/RESOLVED), and an assignee.

## 10. Repository layout (planned)
```
/backend            NestJS app (src/modules/*, prisma/, test/)
/chaincode/aegis    Go chaincode + tests
/infra              docker-compose.yml, fabric/ scripts, secrets/ (git-ignored), scripts/
/docs               this documentation
```
The frontend lives in the teammate's tree. Whether it joins this repo as `/frontend` or stays separate is an open decision.

## 11. Local development and deployment

**Local (Windows host + WSL2 + Docker Desktop):**
- `infra/docker-compose.yml` runs `postgres` (5432), `minio` (9000 internal; console bound to 127.0.0.1:9001), and `api` (3000). All services share the `aegis` network.
- Fabric runs via `infra/fabric/network.sh`, which wraps `fabric-samples/test-network` with channel `aegischannel` and chaincode `aegis`. The API container joins the Fabric Docker network and gets the peer TLS CA and its client cert/key mounted from git-ignored paths.
- `LEDGER_DRIVER=memory|fabric`. The in-memory driver is for unit tests and early development, and the app **refuses to start** with `memory` when `NODE_ENV=production`.
- The frontend dev server proxies `/api` to `localhost:3000`, so cookies are same-origin. WebAuthn RP ID is `localhost` and the expected origin is `http://localhost:5173`, set through configuration.

**Deployment (beyond the hackathon, documented only):** a TLS-terminating reverse proxy → API container(s) with an external session store already in Postgres; managed Postgres with TLS; MinIO with SSE and versioning, or an S3-compatible service; KEK in KMS or Vault; a Fabric network with at least 2 orgs, a Raft ordering service, and HSM-backed or Fabric CA-managed identities; secrets injected by the orchestrator, never baked into images.
