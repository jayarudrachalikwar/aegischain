# AegisChain 2.0 — Frontend (prototype)

React 19 + TypeScript + Vite + Tailwind UI for AegisChain: access control for confidential engineering
documents (encrypted off-chain storage, passkey + TOTP login, time-limited grants, integrity checks against a
Hyperledger Fabric ledger, tamper-evident audit).

> **Status: interactive prototype running on simulated data.** By default (`VITE_DEMO_MODE=true`) the UI uses
> an in-browser mock store and never contacts the backend. The backend is built separately (see `../docs/`),
> and most of its security features are still planned.

## What is real vs simulated

| Area | In this UI |
|---|---|
| SHA-256 hashing and comparison | **Real** (browser Web Crypto, `src/utils/crypto.ts`) |
| Passkey login (WebAuthn) | Simulated; no `navigator.credentials` call yet |
| TOTP | Simulated; any 6 digits are accepted in demo mode |
| AES-256-GCM encryption, file upload | Simulated (label only; no bytes encrypted or sent) |
| Blockchain panel (block height, TPS, peers, tx hashes) | Simulated numbers; the planned ledger is Hyperledger Fabric |
| Audit log, alerts, grants, approvals | Mock data in `src/api/mockAdapter.ts` |
| Role-based screens | UI convenience only (`src/config/access.ts`); the **server** must enforce authorization |

The seeded demo assets' stored hashes are the real SHA-256 of their sample text, so "Verify" passes and the
"Simulate tamper" button demonstrates a genuine mismatch.

## Run

Prerequisites: Node.js >= 22 (see `../.nvmrc`), npm.
```bash
npm ci
cp .env.example .env     # optional; demo mode is the default
npm run dev              # http://localhost:5173
npm run build            # type-check + production build
npm run lint             # oxlint
```
Sign in from `/login` using the "Fast role tester" (demo users, any 6-digit code).

## Real mode (not complete)
`VITE_DEMO_MODE=false` routes calls through `src/api/client.ts` to `/api/v1` (same-origin; the Vite dev
proxy forwards `/api` to the backend, see `vite.config.ts` and `VITE_PROXY_TARGET`). The transport follows
the API contract (cookie session, `X-CSRF-Token`, `{error:{code,message,requestId}}` errors), but endpoint
paths and response shapes still follow the prototype. The mapping to do is in `../docs/FRONTEND_INTEGRATION.md`.

## Routes
`/` and `/portal` (public explainer with an interactive hash-verification demo) · `/login` · `/passkeys` ·
`/mfa` · `/dashboard` · `/assets` · `/upload` · `/assets/:id` · `/request-access` · `/approvals` ·
`/access-management` · `/audit-logs` · `/security-alerts` · `/users` · `/profile`.
Protected routes redirect to `/login` when signed out; screens a role should not use show a notice.

## Roles (match the backend design)
EMPLOYEE, MANAGER, ADMIN, AUDITOR, SECURITY_OFFICER. Classifications: INTERNAL, CONFIDENTIAL, RESTRICTED.
