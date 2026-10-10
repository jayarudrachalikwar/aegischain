# AegisChain 2.0 — Sovereign Defence Asset Custody & Zero-Trust Frontend

A high-assurance, production-ready frontend for **AegisChain 2.0**, engineered for Bharat Electronics Limited (BEL) and sovereign defence organizations. AegisChain provides zero-trust identity references, WebAuthn/FIDO2 hardware passkeys, RFC 6238 TOTP MFA, controlled asset custody, client-side Web Crypto SHA-256 verification, and immutable consortium audit logging.

---

## 🛡️ Core Guarantees & Architecture

1. **Zero Sensitive Payloads On-Chain**: All defence payloads, CAD models, and calibration tables are encrypted and stored off-chain with **AES-256-GCM**. Only cryptographic SHA-256 fingerprints, ownership metadata, time-bound access grants, and audit events are anchored to the consortium ledger.
2. **Local Download Integrity Gate**: On every asset download, the browser Web Crypto API (`window.crypto.subtle.digest`) recomputes the SHA-256 hash. If even a single bit diverges from the on-chain anchor, decryption is immediately aborted and a security incident is logged.
3. **Automated Velocity Telemetry**: Bulk download attacks (>3 rapid transfers in a narrow window) trigger an automatic defensive lockdown of the operator's session.
4. **Separation of Duties**: Role-based authority matrices partition responsibilities between **Admin**, **Manager**, **Auditor**, **Engineer**, and **Contractor** accounts with mathematically enforced boundaries.

---

## 🚀 Running the Frontend

### Prerequisites
- Node.js >= 18
- npm >= 9

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional, defaults to demo mode)
cp .env.example .env

# 3. Start development server with live HMR
npm run dev

# 4. Open in browser
http://localhost:5173
```

### Production Build & Preview
```bash
# Type check and build
npm run build

# Preview production build
npm run preview
```

---

## 🗺️ Application Routes

| Route | Page | Description |
|---|---|---|
| `/` or `/portal` | **Trust Portal** | Sovereign defence landing page with interactive 5-stage Proof Rail, threat matrix, architecture diagram, and real-time Web Crypto verification gate. |
| `/login` | **Login Gateway** | WebAuthn passkey assertion, TOTP MFA challenge, and quick demo role switcher. |
| `/passkeys` | **Passkey Setup** | Register, inspect, rename, and revoke hardware FIDO2 authenticators. |
| `/mfa` | **MFA Setup** | RFC 6238 TOTP enrollment with QR code, secret key, and emergency recovery codes. |
| `/dashboard` | **Command Centre** | Real-time telemetry, active grants, pending approvals, and consortium event activity. |
| `/assets` | **My Assets** | Defence asset vault with classification filters, search, and custody state. |
| `/upload` | **Upload Asset** | Web Crypto SHA-256 hashing, AES-256-GCM encryption simulation, and on-chain registration. |
| `/assets/:id` | **Asset Details** | On-chain provenance, ACL, live download integrity gate, and 1-bit tamper simulation. |
| `/request-access` | **Request Access** | Time-bound clearance request with operational mission justification. |
| `/approvals` | **Approval Queue** | Director review queue, grant approval/rejection with duration override. |
| `/access-management` | **Access Grants** | Active grants table, countdown to auto-expiry, instant revocation, and emergency freeze. |
| `/audit-logs` | **Audit Ledger** | Searchable immutable event ledger with CSV & JSON compliance export. |
| `/security-alerts` | **Security Telemetry** | Incident monitor, tamper alerts, velocity violations, and acknowledge workflows. |
| `/users` | **User Management** | Identity directory, DID issuer (`did:aegis:bel:...`), clearance levels, and roles. |
| `/profile` | **Profile & Security** | Operator DID inspection, public key fingerprint, active sessions, and emergency kill switch. |

---

## 🎨 Design System & Palette (Strict Combo 2)

- **Deep Defence Navy**: `#0C2C55` (Primary canvas headers, ink borders, command panels, text)
- **Radar Steel Cyan**: `#629FAD` (Active indicators, verification seals, telemetry, accents)
- **Technical Defence Parchment**: `#EDEDCE` (Main background canvas, card surfaces)
- **Typography**: `Instrument Serif` (Headlines), `IBM Plex Mono` (Security metadata, technical logs), `IBM Plex Sans` (Body).
