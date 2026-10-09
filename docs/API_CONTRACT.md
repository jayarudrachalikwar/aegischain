# AegisChain 2.0 — API Contract (v1)

Status: **Draft contract, not implemented.** This document is the agreement between the backend and the React frontend. Contract changes must update this file in the same commit. Once the backend exists it will also serve an OpenAPI document at `GET /api/v1/openapi.json`, and that generated spec must match this file.

Items marked **[DECISION]** need a team decision before they are implemented.

## 0. Conventions

- **Base URL:** `/api/v1`. In development the frontend proxies `/api` to `http://localhost:3000` so cookies stay same-origin.
- **Format:** JSON (`Content-Type: application/json`), except uploads (`multipart/form-data`) and downloads (binary).
- **IDs:** UUID strings. **Times:** ISO-8601 UTC (`2026-10-09T12:00:00Z`).
- **Auth:** session cookie `aegis_sid` (HttpOnly, set by the server). The frontend never reads it. Use `fetch(..., { credentials: "include" })`.
- **CSRF:** every `POST/PUT/PATCH/DELETE` must send header `X-CSRF-Token` with the value of the `aegis_csrf` cookie (readable by JS). The cookie is set by `GET /auth/session` and refreshed on login.
- **Auth levels used below:**
  - `public`: no session.
  - `pending`: a session in the specific pending state named.
  - `active`: a fully authenticated session (passkey + TOTP).
  - `step-up`: `active`, plus a TOTP re-verification (`POST /auth/step-up`) within the last 5 minutes. Without it the response is `403 STEP_UP_REQUIRED`.
- **Roles:** `EMPLOYEE`, `MANAGER`, `ADMIN`, `AUDITOR`, `SECURITY_OFFICER`. "any" means any role with an `active` session. The UI must not rely on its own role checks. The server enforces everything.
- **Pagination:** `?limit=` (1–100, default 20) and `&cursor=` (opaque). The response is `{ "items": [...], "nextCursor": "..." | null }`.
- **Validation:** request bodies are validated strictly. Unknown properties are rejected (`400 VALIDATION_FAILED`). Strings are trimmed, and length limits appear next to each field.
- **Rate limits:** the auth endpoints allow 10 req/min per IP plus per-account limits. Download allows 30/min per user. When exceeded the response is `429 RATE_LIMITED` with a `Retry-After` header.
- **Request id:** every response includes an `X-Request-Id` header, which is echoed in errors.

### Error format (all errors)
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary safe to show to users",
    "details": [{ "field": "reason", "issue": "must be 10-500 characters" }],
    "requestId": "01J9Z..."
  }
}
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Malformed or invalid input |
| 401 | `UNAUTHENTICATED` | Missing, expired, or invalid session |
| 401 | `MFA_REQUIRED` | Session is `MFA_PENDING`. Go to the TOTP step |
| 401 | `ENROLLMENT_REQUIRED` | Session is `ENROLLMENT_PENDING`. Go to TOTP enrollment |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 403 | `CSRF_INVALID` | Missing or mismatched CSRF token |
| 403 | `STEP_UP_REQUIRED` | Call `POST /auth/step-up` and retry |
| 403 | `ACCOUNT_LOCKED` | User is locked or suspended |
| 404 | `NOT_FOUND` | Resource missing **or** not visible to the caller (so existence isn't leaked) |
| 409 | `CONFLICT` | State conflict (e.g., request already decided) |
| 409 | `ASSET_NOT_READY` | Ledger registration not yet confirmed |
| 409 | `INTEGRITY_FAILURE` | Hash or GCM verification failed. No content is released |
| 413 | `FILE_TOO_LARGE` | Over the upload limit (25 MB default) |
| 415 | `UNSUPPORTED_FILE_TYPE` | Extension or magic bytes not on the allowlist |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 503 | `LEDGER_UNAVAILABLE` | Fabric is unreachable. Fails closed |
| 500 | `INTERNAL` | Unexpected error. No internals are leaked |

Auth failures always use the generic message "Authentication failed", so user existence isn't revealed.

### Shared objects
```jsonc
// User (as seen by self / admin)
{ "id": "uuid", "did": "did:aegis:uuid", "email": "a@corp.example", "displayName": "Asha R",
  "role": "EMPLOYEE", "department": "Structural", "status": "ACTIVE",   // INVITED|ACTIVE|SUSPENDED|LOCKED
  "totpEnrolled": true, "createdAt": "...", "lastLoginAt": "..." }

// UserSummary (as seen by others)
{ "id": "uuid", "did": "did:aegis:uuid", "displayName": "Asha R", "department": "Structural" }

// Asset
{ "id": "uuid", "title": "Bridge girder drawing", "description": "...", "classification": "CONFIDENTIAL", // INTERNAL|CONFIDENTIAL|RESTRICTED
  "department": "Structural", "owner": { /* UserSummary */ },
  "currentVersion": { "id": "uuid", "number": 1, "fileName": "girder.pdf", "mimeType": "application/pdf",
    "sizeBytes": 482113, "sha256": "hex64", "chainStatus": "CONFIRMED", "chainTxId": "hex", "createdAt": "..." },
  "frozen": false,
  "myAccess": "OWNER",            // OWNER | GRANTED | NONE  (computed for the caller)
  "myGrantExpiresAt": null,
  "createdAt": "..." }

// AccessRequest
{ "id": "uuid", "asset": { "id": "uuid", "title": "..." }, "requester": { /* UserSummary */ },
  "reason": "...", "requestedDurationHours": 72, "status": "PENDING", // PENDING|APPROVED|DENIED|CANCELLED
  "decidedBy": null, "decisionNote": null, "decidedAt": null, "grantId": null, "createdAt": "..." }

// Grant
{ "id": "uuid", "assetId": "uuid", "grantee": { /* UserSummary */ }, "grantedBy": { /* UserSummary */ },
  "status": "ACTIVE",            // ACTIVE|EXPIRED|REVOKED  (ACTIVE also requires expiresAt > now)
  "issuedAt": "...", "expiresAt": "...", "revokedAt": null, "revokedBy": null, "revokeReason": null,
  "chainStatus": "CONFIRMED", "chainTxId": "hex" }
```

---

## 1. Session and authentication

### `GET /auth/session` (public)
Returns the current session state and sets the `aegis_csrf` cookie.
```json
200 { "state": "ANONYMOUS" }                         // or ENROLLMENT_PENDING | MFA_PENDING | ACTIVE
200 { "state": "ACTIVE", "user": { /* User */ }, "stepUpValidUntil": null, "expiresAt": "..." }
```

### Invite-based passkey registration
An admin creates a user (§4), and the response contains a one-time invite link `…/onboard?token=<inviteToken>`. The token is 256-bit random, valid for 48 h, single-use, and only its hash is stored.

**`POST /auth/register/options`** (public, rate-limited)
```json
// req
{ "inviteToken": "base64url (43 chars)" }
// 200
{ "challengeId": "uuid", "publicKey": { /* PublicKeyCredentialCreationOptionsJSON:
   rp {id,name}, user {id,name,displayName}, challenge, pubKeyCredParams [-7,-257],
   authenticatorSelection { residentKey: "required", userVerification: "required" },
   timeout: 300000, attestation: "none", excludeCredentials [] */ } }
```
Errors: `400`, `401 UNAUTHENTICATED` (invalid, expired, or used invite).

**`POST /auth/register/verify`** (public)
```json
// req
{ "inviteToken": "...", "challengeId": "uuid", "credential": { /* RegistrationResponseJSON from @simplewebauthn/browser */ },
  "credentialName": "Work laptop" }        // 1-50 chars, optional
// 201 → sets aegis_sid (ENROLLMENT_PENDING); invite consumed
{ "state": "ENROLLMENT_PENDING" }
```
Each challenge is single-use and expires after 5 minutes. A reused or expired challenge returns `401`.

### Passkey login
**`POST /auth/login/options`** (public, rate-limited)
```json
// req (email optional; omit for discoverable-credential / usernameless login)
{ "email": "a@corp.example" }
// 200 (same shape whether or not the email exists)
{ "challengeId": "uuid", "publicKey": { /* PublicKeyCredentialRequestOptionsJSON, userVerification: "required" */ } }
```
**`POST /auth/login/verify`** (public)
```json
// req
{ "challengeId": "uuid", "credential": { /* AuthenticationResponseJSON */ } }
// 200 → sets aegis_sid (MFA_PENDING, 5 min)
{ "state": "MFA_PENDING" }
```
Errors: `401 UNAUTHENTICATED`, `403 ACCOUNT_LOCKED`, `429`.

### TOTP
**`POST /auth/totp/enroll`** (pending: `ENROLLMENT_PENDING`)
```json
// 200: secret returned ONLY here, ONLY while enrollment is unconfirmed. Calling again regenerates it.
{ "otpauthUri": "otpauth://totp/AegisChain:a%40corp.example?secret=...&issuer=AegisChain&digits=6&period=30",
  "secret": "BASE32...", "qrCodeDataUrl": "data:image/png;base64,..." }
```
**`POST /auth/totp/enroll/verify`** (pending: `ENROLLMENT_PENDING`)
```json
// req
{ "code": "123456" }            // exactly 6 digits
// 200 → session rotated to ACTIVE; user status INVITED→ACTIVE; DID registered on ledger (outbox)
{ "state": "ACTIVE", "user": { /* User */ } }
```
**`POST /auth/mfa/verify`** (pending: `MFA_PENDING`)
```json
{ "code": "123456" }
// 200 → session rotated to ACTIVE
{ "state": "ACTIVE", "user": { /* User */ } }
```
A reused code (same or earlier time-step) is rejected. Five failures destroy the pending session. Ten failures in an hour lock the account and raise an alert.

**`POST /auth/step-up`** (active)
```json
{ "code": "123456" }
// 200
{ "stepUpValidUntil": "2026-10-09T12:05:00Z" }
```

**`POST /auth/logout`** (any session) → `204`. The server deletes the session and clears the cookies.

**[DECISION] Account recovery:** the MVP has no self-service recovery and no recovery codes. A user who loses a passkey or authenticator asks an ADMIN to run `reset-credentials` (§4). Recovery codes could be added later.

---

## 2. Current user (profile and passkeys)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me` | active | Returns `User` |
| PATCH | `/me` | active | `{ "displayName": "1-80 chars" }`. Role, email, and department are admin-only |
| GET | `/me/passkeys` | active | `[{ "id", "name", "createdAt", "lastUsedAt", "backedUp": true }]` |
| POST | `/me/passkeys/options` | step-up | Same response shape as register/options |
| POST | `/me/passkeys/verify` | step-up | `{ challengeId, credential, credentialName }` → `201 { id, name }` |
| DELETE | `/me/passkeys/:id` | step-up | `204`. Removing the last passkey returns `409 CONFLICT` |
| GET | `/me/sessions` | active | Lists own sessions (id, createdAt, lastSeenAt, userAgent, current) |
| DELETE | `/me/sessions/:id` | active | `204` |

---

## 3. Users directory

| Method | Path | Auth/Roles | Notes |
|---|---|---|---|
| GET | `/users?query=&department=` | active, any | Returns `UserSummary[]` (paginated). Used for pickers. No emails |

---

## 4. Administration (ADMIN)

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/admin/users?status=&role=&query=` | active, ADMIN | Paginated `User[]` |
| POST | `/admin/users` | step-up, ADMIN | `{ email, displayName, role, department }` → `201 { user, inviteUrl, inviteExpiresAt }` (the invite is shown once) |
| GET | `/admin/users/:id` | active, ADMIN | `User` + `{ passkeyCount, activeSessions }` |
| PATCH | `/admin/users/:id` | step-up, ADMIN | `{ displayName?, department? }` |
| PUT | `/admin/users/:id/role` | step-up, ADMIN | `{ role, reason }`. Changing one's own role returns `403`. Granting ADMIN or SECURITY_OFFICER raises an alert |
| POST | `/admin/users/:id/suspend` | step-up, ADMIN | `{ reason }`. Kills sessions and sets DID status SUSPENDED on the ledger. Suspending oneself returns `403` |
| POST | `/admin/users/:id/reactivate` | step-up, ADMIN | `{ reason }` |
| POST | `/admin/users/:id/reset-credentials` | step-up, ADMIN | `{ reason }`. Deletes passkeys and TOTP, kills sessions, and returns a new `{ inviteUrl }`. Raises an alert |

Validation: `email` must be RFC-valid and ≤254 characters. `displayName` is 1–80 characters, `department` is 1–60 characters, and `reason` is 10–500 characters. Role must come from the enum.

**[DECISION]** Should ADMIN or SECURITY_OFFICER role changes need a second admin's approval (two-person rule)? The MVP default is no: an alert is raised and the change is audited.

---

## 5. Assets

**`POST /assets`** (active, any role except AUDITOR) multipart:

| field | rule |
|---|---|
| `file` | required. ≤25 MB. Extension and magic bytes in {pdf, png, jpg/jpeg, txt, csv, dxf, step/stp, stl} |
| `title` | 3–120 chars |
| `description` | 0–1000 chars |
| `classification` | `INTERNAL` \| `CONFIDENTIAL` \| `RESTRICTED` |

`201` returns `Asset` with `currentVersion.chainStatus: "PENDING"`. Poll `GET /assets/:id` until the status is `CONFIRMED`. Errors: `400`, `413`, `415`.

**`GET /assets?scope=&query=&classification=&cursor=&limit=`** (active, any)
- `scope=mine` (owned), `granted` (active grant), `department` (metadata of assets in the caller's department, so access can be requested), `all` (AUDITOR and SECURITY_OFFICER only, otherwise `403`).
- Returns a paginated `Asset[]`. Metadata only, never content.

**`GET /assets/:id`** (active) returns `Asset`. The asset must be visible under one of the scopes above, otherwise `404`.

**`GET /assets/:id/download`** (active)
- Allowed for the owner or a holder of an `ACTIVE`, unexpired, unrevoked grant. The asset must not be frozen and its version must be `CONFIRMED`.
- `200` with binary body. Headers: `Content-Type`, `Content-Disposition: attachment; filename="..."`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `X-Aegis-SHA256: <hex>`, `X-Aegis-Chain-Tx: <txid>`.
- Errors: `404` (not visible), `403 FORBIDDEN` (visible but no grant), `409 ASSET_NOT_READY`, `409 INTEGRITY_FAILURE`, `503 LEDGER_UNAVAILABLE`, `429`.
- Frontend note: use `fetch` + `blob()` (the CSRF header is not needed for GET), or a plain `<a href>` since the cookie is same-origin.

**`GET /assets/:id/history`** (active; owner, grantee, AUDITOR, SECURITY_OFFICER) returns ledger history:
```json
{ "items": [ { "txId": "hex", "timestamp": "...", "type": "REGISTERED|TRANSFERRED|GRANT_ISSUED|GRANT_REVOKED|GRANT_EXPIRED|FROZEN",
               "actorDid": "did:aegis:...", "data": { } } ] }
```

**`POST /assets/:id/transfer`** (step-up, owner only) **[DECISION]**
`{ "newOwnerId": "uuid", "reason": "10-500" }` → `200 Asset`. The MVP transfers immediately. An open question is whether the recipient must accept. Existing grants remain valid.

**`POST /assets/:id/versions`** (owner) **[DECISION, deferred past MVP]**
Would upload a new version. Each version gets its own DEK and ledger record. Not scheduled for the MVP.

---

## 6. Integrity

**`POST /assets/:id/verify`** (active; owner, grantee, AUDITOR, SECURITY_OFFICER)
The server decrypts the stored object, hashes it, and compares the result with the ledger.
```json
200 { "assetId": "uuid", "versionId": "uuid", "result": "MATCH",        // MATCH | MISMATCH
      "computedSha256": "hex", "ledgerSha256": "hex", "ledgerTxId": "hex",
      "registeredAt": "...", "checkedAt": "..." }
```
A `MISMATCH` returns `200` (the check itself succeeded) and raises a CRITICAL alert.

**`POST /integrity/check`** (active, any)
The client hashes a local file with WebCrypto and sends only the hash.
```json
// req
{ "assetId": "uuid", "sha256": "64 lowercase hex chars" }
// 200
{ "result": "MATCH", "ledgerSha256": "hex", "ledgerTxId": "hex", "versionId": "uuid" }   // or MISMATCH
```
The UI must word results accurately, for example: "MATCH means this file is byte-identical to the version registered at <time>. It does not certify the content is correct."

---

## 7. Access requests and grants

| Method | Path | Auth/Roles | Request → Response |
|---|---|---|---|
| POST | `/access-requests` | active, any except AUDITOR | `{ assetId, reason (10-500), requestedDurationHours (1-720) }` → `201 AccessRequest`. Requesting one's own asset or duplicating a pending request returns `409` |
| GET | `/access-requests?scope=mine\|to-review&status=` | active | Paginated. `to-review` lists requests the caller may decide |
| GET | `/access-requests/:id` | active | Requester, eligible approver, AUDITOR, SECURITY_OFFICER |
| POST | `/access-requests/:id/approve` | step-up; owner or same-department MANAGER; not the requester | `{ durationHours (1-720, ≤ requested), note? }` → `200 { request, grant }` |
| POST | `/access-requests/:id/deny` | active; same approvers | `{ note (10-500) }` → `200 AccessRequest` |
| POST | `/access-requests/:id/cancel` | active; requester | `204` |
| GET | `/grants?assetId=&granteeId=&status=` | active | Owner sees grants on own assets. Grantee sees own grants. SECURITY_OFFICER and AUDITOR see all |
| GET | `/grants/:id` | active | Same visibility rules |
| POST | `/grants/:id/revoke` | active; asset owner, the approver, or SECURITY_OFFICER | `{ reason (10-500) }` → `200 Grant` (status `REVOKED`, takes effect immediately). Revoking an already terminal grant returns `409` |

**[DECISION]** Should `RESTRICTED` assets require MANAGER approval even when the owner is an EMPLOYEE? The MVP default is no.

---

## 8. Audit (AUDITOR, SECURITY_OFFICER)

**`GET /audit/events?actorId=&action=&targetType=&targetId=&outcome=&from=&to=&cursor=&limit=`**
```json
{ "items": [ { "seq": 1042, "ts": "...", "actor": { "id": "uuid", "did": "...", "role": "MANAGER" },
   "action": "GRANT_APPROVED", "targetType": "ACCESS_REQUEST", "targetId": "uuid",
   "outcome": "SUCCESS", "ip": "203.0.113.5", "requestId": "...", "details": { },
   "prevHash": "hex", "hash": "hex" } ], "nextCursor": "..." }
```
Action enum (initial): `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `AUTH_MFA_FAILED`, `AUTH_LOGOUT`, `PASSKEY_ADDED`, `PASSKEY_REMOVED`, `TOTP_ENROLLED`, `USER_CREATED`, `USER_ROLE_CHANGED`, `USER_SUSPENDED`, `USER_REACTIVATED`, `USER_CREDENTIALS_RESET`, `ASSET_UPLOADED`, `ASSET_DOWNLOADED`, `ASSET_DOWNLOAD_DENIED`, `ASSET_TRANSFERRED`, `ASSET_FROZEN`, `ASSET_UNFROZEN`, `INTEGRITY_CHECKED`, `ACCESS_REQUESTED`, `GRANT_APPROVED`, `ACCESS_DENIED`, `GRANT_REVOKED`, `GRANT_EXPIRED`, `LEDGER_TX_FAILED`, `AUDIT_ANCHORED`, `ALERT_UPDATED`.

**`GET /audit/verify`** (AUDITOR, SECURITY_OFFICER)
```json
200 { "valid": true, "eventsChecked": 10421, "headSeq": 10421, "headHash": "hex",
      "lastAnchor": { "seq": 10400, "hash": "hex", "ledgerTxId": "hex", "anchoredAt": "..." },
      "firstBrokenSeq": null }
```

**`GET /users/:id/activity`** (self or AUDITOR/SECURITY_OFFICER) returns a paginated audit subset for one user. A user can read only their own activity.

---

## 9. Security operations (SECURITY_OFFICER; AUDITOR read-only)

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/security/alerts?status=&severity=` | SECURITY_OFFICER, AUDITOR | Paginated `Alert` |
| GET | `/security/alerts/:id` | SECURITY_OFFICER, AUDITOR | |
| POST | `/security/alerts/:id/acknowledge` | SECURITY_OFFICER | `{ note? }` |
| POST | `/security/alerts/:id/resolve` | SECURITY_OFFICER | `{ resolution: "FALSE_POSITIVE\|MITIGATED\|ACCEPTED_RISK", note (10-500) }` |
| POST | `/security/users/:id/lock` | SECURITY_OFFICER (step-up) | `{ reason }`. Kills sessions. Locking oneself returns `403` |
| POST | `/security/users/:id/unlock` | SECURITY_OFFICER (step-up) | `{ reason }`. Unlocking oneself returns `403` |
| POST | `/security/assets/:id/freeze` | SECURITY_OFFICER (step-up) | `{ reason }`. Blocks all downloads, including the owner's. Recorded on the ledger |
| POST | `/security/assets/:id/unfreeze` | SECURITY_OFFICER (step-up) | `{ reason }` |
| GET | `/security/ledger/status` | SECURITY_OFFICER, AUDITOR | `{ driver, reachable, outboxPending, outboxFailed, lastReconciledAt, divergences }` |

```jsonc
// Alert
{ "id": "uuid", "type": "MFA_BRUTE_FORCE", "severity": "HIGH",   // LOW|MEDIUM|HIGH|CRITICAL
  "status": "OPEN", "subjectUserId": "uuid|null", "assetId": "uuid|null",
  "summary": "10 failed TOTP attempts in 1h", "evidence": { "auditSeqs": [1001, 1002] },
  "createdAt": "...", "acknowledgedBy": null, "resolvedBy": null, "resolution": null }
```
Alert `type` enum: `MFA_BRUTE_FORCE`, `LOGIN_ANOMALY`, `ACCESS_DENIAL_BURST`, `INTEGRITY_MISMATCH`, `LEDGER_DIVERGENCE`, `LEDGER_TX_FAILED`, `AUDIT_CHAIN_BROKEN`, `PRIVILEGED_ROLE_GRANTED`, `CREDENTIALS_RESET`, `ADMIN_ACTION_ON_SECURITY_TARGET`.

---

## 10. Health

`GET /health` (public) → `200 { "status": "ok" }` (liveness, no dependency checks). `GET /health/ready` (public) → `200|503 { "db": "up|down", "storage": "up|down" }` (**M0**: `ledger` is added in M6/M9 when a ledger exists). Both are under `/api/v1`. Versions and internals are never exposed.
