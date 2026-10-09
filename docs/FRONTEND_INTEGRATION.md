# Frontend ↔ Backend integration notes

_Status (2026-10-09): the frontend runs on mock data. Real mode has contract-style transport but unmapped endpoints. Backend implements only `/api/v1/health` and `/api/v1/health/ready`. This file is the work list for milestone M12 (and the per-milestone wiring before it)._

## Already aligned (frontend)
- Roles (5), classifications (INTERNAL / CONFIDENTIAL / RESTRICTED), role-to-screen rules (`frontend/src/config/access.ts`, mirrors `API_CONTRACT.md` and `ARCHITECTURE.md` §4.2).
- Transport in `frontend/src/api/client.ts` (`http()`): same-origin `/api/v1`, `credentials: 'include'`, `X-CSRF-Token` from the `aegis_csrf` cookie on mutations, contract error parsing into `ApiError`.
- Vite dev proxy `/api` → backend (`VITE_PROXY_TARGET`, default `http://localhost:3000`; use 3100 if 3000 is busy).
- Chain wording: Hyperledger Fabric (simulated); no Besu/IBFT/contract-address claims; no organization branding.
- Signed-out start + route guard (UX only).

## Mapping still to do
| UI call today (`client.ts`) | Contract endpoint | Gap |
|---|---|---|
| `POST /auth/passkey/login-verify {username}` | `POST /auth/login/options` then `/auth/login/verify` | Needs `@simplewebauthn/browser` (`startAuthentication`); session is a cookie, not a returned token |
| `POST /auth/totp/verify {code, username}` | `POST /auth/mfa/verify {code}` | No username in body; session state machine (`MFA_PENDING` → `ACTIVE`) |
| `GET/POST/DELETE /auth/passkeys…` | `/me/passkeys`, `/me/passkeys/options|verify` (step-up) | Registration is a WebAuthn ceremony |
| (none) | `GET /auth/session`, `POST /auth/logout`, `POST /auth/step-up` | UI has no session bootstrap or step-up prompt |
| MFA setup page | `POST /auth/totp/enroll`, `/enroll/verify` | Secret shown once, only while unconfirmed; recovery codes are **not** in the MVP |
| `GET /assets`, `GET /assets/:id` | `GET /assets?scope=…`, `GET /assets/:id` | Response shape differs (nested `currentVersion`, `chainStatus`, `myAccess`); pagination `{items,nextCursor}` |
| `POST /assets/register` (JSON metadata + hash) | `POST /assets` multipart (`file`, `title`, `description`, `classification`) | **Real file upload**; server hashes and encrypts; UI must stop sending a client hash as truth |
| Client-side verify + "download" | `GET /assets/:id/download`, `POST /assets/:id/verify`, `POST /integrity/check` | Authoritative check is **server-side** vs ledger; the browser check becomes the optional "hash a local file" tool (`/integrity/check`) |
| `/access/requests` (GET/POST) | `/access-requests` (+ `?scope=mine|to-review`) | `requestedDurationHours`, `reason` 10–500 chars |
| `POST /access/approvals/:id/decision` | `POST /access-requests/:id/approve|deny` | Approve needs step-up; deny needs `note` |
| `/access/grants`, `…/revoke` | `GET /grants`, `POST /grants/:id/revoke {reason}` | Reason 10–500 chars |
| `GET /audit/logs` | `GET /audit/events`, `GET /audit/verify` | Fields `seq`, `prevHash`, `hash`; role-limited to AUDITOR / SECURITY_OFFICER |
| `GET/POST /security/alerts` | `GET /security/alerts`, ack/resolve endpoints | **Alerts are created by the server**; the UI's `recordAlert` and client-side "tamper/bulk download" triggers must go away in real mode |
| `POST /security/lockdown/toggle` (global lockdown) | none | **Not in the contract.** Contract offers per-user lock and per-asset freeze (`/security/users/:id/lock`, `/security/assets/:id/freeze`). Decide: add a global kill switch to the design, or remove it from the UI |
| `GET /users`, `PUT /users/:id/role` | `GET /users` (directory), `PUT /admin/users/:id/role {role, reason}` (step-up) | Admin endpoints live under `/admin` |
| Header chain stats (block, TPS, peers) | `GET /security/ledger/status` | Replace simulated numbers with real status |

## Behaviour changes needed for real mode
1. Drop client-side lockdown and tamper triggers; display server alerts instead.
2. Show `chainStatus` (`PENDING` → `CONFIRMED`) after upload; downloads are blocked until confirmed (`409 ASSET_NOT_READY`).
3. Handle `STEP_UP_REQUIRED` by prompting for a TOTP code, then retrying.
4. Never store tokens in `localStorage`; the session cookie is HttpOnly.
5. Keep demo mode available (clearly bannered) for evaluations.
