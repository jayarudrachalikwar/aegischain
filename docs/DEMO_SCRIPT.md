# AegisChain 2.0 — Live Demo Script (5 minutes)

_Verified against the repo at `128821c` on 2026-10-09. Backend readiness and the frontend build were actually run; the click-through below follows the code but has not been rehearsed in a browser — rehearse it once._

## Ground rules (blind evaluation)
- Never show: GitHub page, `git log`/`git remote`, a terminal whose prompt shows your username/path, browser profile or tabs, the repo's folder path. Use a clean full-screen browser and a terminal with a neutral prompt (`PS1='$ '` in bash).
- The UI carries no organization branding; do not claim the project is for, or affiliated with, any real organization.

## What is real vs simulated (say this out loud)
- **Real:** backend foundation, Postgres + MinIO health, tests, SHA-256 hashing in the browser.
- **Simulated (prototype data):** login, passkeys, TOTP, encryption, blockchain panel, approvals/grants/audit lists.
- **Do not present as real:** passkey login, TOTP check, AES encryption, "on-chain" transaction hashes, block height/TPS/peers, the audit ledger, role enforcement.

## Pre-demo checklist (do 15 minutes before)
- [ ] Docker Desktop running; `docker compose -f infra/docker-compose.yml ps` shows `postgres` and `minio` **healthy**.
- [ ] `infra/secrets/` exists (`node infra/scripts/gen-secrets.mjs` if not; run with `POSTGRES_PORT=55432` set if `infra/.env` sets it).
- [ ] `cd backend && npm ci` done; `cp .env.example .env`.
- [ ] `cd frontend && npm ci` done.
- [ ] Ports free: backend **3100** (3000 is used on this machine), frontend **5173**.
- [ ] Dry run once; keep a recorded 60-second screen capture as the fallback.

## Startup (three terminals)
```bash
# T1 — infra (skip if already healthy)
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps

# T2 — backend (real)
cd backend && PORT=3100 npm run start:dev          # PowerShell: $env:PORT=3100; npm run start:dev

# T3 — frontend (demo mode is the default)
cd frontend && npm run dev                          # http://localhost:5173
```

## Five-minute sequence

| Time | Do | Expect | Say |
|---|---|---|---|
| 0:00–0:30 | Slide: problem + architecture diagram (`docs/EVALUATION_GUIDE.md` §B) | — | 30-second introduction |
| 0:30–1:15 | T1: `docker compose ... ps` | `postgres` and `minio` `Up (healthy)` | "Real infrastructure: no credentials in files; MinIO image pinned by digest." |
| 1:15–2:00 | T2 healthy: `curl localhost:3100/api/v1/health/ready` | `{"db":"up","storage":"up"}` | "Readiness actually queries Postgres and MinIO." |
| 2:00–2:30 | `curl -i localhost:3100/api/v1/nope` | `404` with `{"error":{"code":"NOT_FOUND",...,"requestId":...}}` and an `X-Request-Id` header | "Uniform errors, no internals, every request traceable." |
| 2:30–3:00 | `cd backend && NODE_ENV=production node dist/main.js` (after `npm run build`) | Exits with a list of problems (LEDGER_DRIVER, DATABASE_URL, AEGIS_KEK_V1), no secret values | "Fails safely; production refuses the in-memory ledger." |
| 3:00–3:30 | Browser `http://localhost:5173/` (Trust Portal). Use the interactive hash box: edit one character of the "downloaded" text | Verification flips from MATCH to MISMATCH; mini audit shows "TAMPER DETECTED" | "This SHA-256 comparison is real browser crypto: one changed character changes the whole hash." |
| 3:30–4:15 | Open `http://localhost:5173/dashboard` (signed out → redirects to `/login`). Use "Fast role tester" → Manager → any 6 digits | Redirect to `/dashboard`; amber "Prototype · simulated data" banner visible; Approvals appears in the sidebar | "UI prototype with simulated sign-in; roles show separation of duties: an admin, for instance, gets no approvals screen. Real server-side auth is next." |
| 4:15–4:45 | `/assets` → open any asset → "Verify & Download" → then "Simulate tamper" | First verify shows **PASS** (stored hash equals the real SHA-256 of the sample); after tamper, **FAIL** and an alert appears under Security Alerts (switch to the Security Officer role to view it) | "Same mechanism the server will apply for real: recompute the hash, compare to the ledger record, block on mismatch. Data here is simulated." |
| 4:45–5:00 | Terminal: `cd backend && npm test` (or show the earlier result) | `Tests: 27 passed` | "27 unit, 14 e2e, plus 15 against real services." Then state the roadmap. |

## Evidence to show
- Healthy containers; the readiness response; the uniform error JSON; safe-failure message; passing tests; the Trust Portal tamper demo; `docs/THREAT_MODEL.md` (SR list) as proof the security design is specified.

## Fallbacks
| Failure | Fallback |
|---|---|
| Docker won't start | Show the recorded clip of `ps` and readiness; run only the frontend demo; say infra is verified in your recording |
| Port 3100/5173 busy | Pick another (`PORT=3200`; `npx vite --port 5174`) |
| Backend won't start | Run `npm test` (unit tests need no Docker); show the safe-failure message |
| Postgres/MinIO unhealthy | `docker compose ... ps`, `docker logs aegischain-minio-1`; fall back to the clip |
| Frontend blank | `npm run build && npx vite preview`; else screenshots |
| Anything with auth | Never promise real passkeys/TOTP; describe as planned M2–M3 |

## Do NOT claim
- That login, passkeys, TOTP, encryption, approvals, revocation, or audit work end-to-end.
- That any blockchain is running, or that tx hashes, block height, TPS, peer count or the contract address are real (the UI labels it "Hyperledger Fabric (simulated)"; none is running).
- That the frontend talks to the backend (default demo mode never does; non-demo paths don't match the contract).
- That the UI is "production-ready", or that role screens/route guards are security (the server must enforce).
