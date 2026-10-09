# AegisChain 2.0 — Threat Model

Status: **Design (Phase 1)**. The mitigations below are planned. None is implemented or tested until `docs/DEV_STATUS.md` records evidence.
Method: assets → trust boundaries → STRIDE-style threats per area → mitigations → residual risk → testable requirements (`SR-xx`). The `SR-xx` IDs are referenced by tests.

## 1. Protected assets
1. Document plaintext.
2. KEK and DEKs.
3. TOTP secrets.
4. Session tokens.
5. Authorization state (roles, grants).
6. Integrity of ledger records.
7. Integrity of the audit log.
8. User PII.
9. Fabric client private key and TLS material.

## 2. Actors
- Anonymous internet attacker.
- Authenticated malicious employee.
- Compromised manager account.
- Malicious ADMIN.
- Malicious SECURITY_OFFICER.
- DB/host operator with infrastructure access.
- Attacker with a stolen device or laptop.
- XSS in the separately built frontend.

## 3. Trust boundaries
| # | Boundary | What crosses it | Controls |
|---|---|---|---|
| TB1 | Browser ↔ API | HTTPS, cookies, uploads | TLS, session, CSRF, validation, rate limits |
| TB2 | API ↔ PostgreSQL | SQL | Least-privilege DB role, parameterized queries (Prisma), TLS in prod |
| TB3 | API ↔ MinIO | Ciphertext only | Internal network only, bucket-scoped credentials, AAD-bound GCM |
| TB4 | API ↔ Fabric peer | Signed transactions | mTLS, org MSP identity, chaincode caller checks |
| TB5 | Host ↔ secrets | KEK, Fabric key, DB passwords | Docker secrets / env in dev; KMS/Vault in prod; git-ignored |
| TB6 | Admin plane | Role changes, resets, freezes | Step-up MFA, separation of duties, alerts, audit |

The frontend is **untrusted**. Any value from the client (role, owner id, hash claims, filenames, MIME type) is input to be validated, never an assertion to trust.

## 4. Threats, mitigations, residual risk

### 4.1 Authentication bypass and session theft
| Threat | Mitigation |
|---|---|
| Phishing or credential stuffing | Passwordless. Passkeys are origin-bound. TOTP is a second factor |
| Session token theft through XSS | `HttpOnly` cookie, so JS cannot read `aegis_sid`. Strict CSP is recommended to the frontend team |
| Token theft from a DB leak | Only SHA-256(token) is stored |
| CSRF | `SameSite=Strict` plus a double-submit `X-CSRF-Token` |
| Session fixation | Token rotates on every state transition (pending → active, step-up) |
| Long-lived stolen sessions | 30 min idle / 8 h absolute timeout. Suspend or lock kills all sessions. Users can list and kill their own sessions |
| Skipping the MFA step | `SessionGuard` admits only `ACTIVE` sessions to normal routes. Pending sessions are restricted to an explicit allowlist of routes |
| User enumeration | Generic auth errors. `login/options` returns the same response shape for unknown emails |
| Invite token leak | 256-bit token, hashed at rest, 48 h expiry, single use. Enrollment also requires TOTP |

Residual risk: malware on an unlocked endpoint can ride a live session. XSS in the frontend can still issue same-origin requests while the user is logged in. Step-up limits the damage for the most sensitive actions.

### 4.2 Broken access control and privilege escalation
| Threat | Mitigation |
|---|---|
| IDOR on `/assets/:id`, `/grants/:id`, `/access-requests/:id` | Resource-level checks in services, not just `@Roles`. Not-visible resources return `404` |
| Mass assignment (`role`, `ownerId`, `status` in bodies) | DTO whitelist with `forbidNonWhitelisted`. Owner is always taken from the session |
| Self-approval or self-escalation | SoD checks: requester ≠ approver ≠ grantee-approver; no self role change or self unlock |
| Manager approving outside their department | Approver must be the asset owner or a MANAGER whose department equals the asset's department |
| Routes missing a guard | Global guards are deny-by-default. Public routes need an explicit `@Public()`. A test enumerates all routes and asserts guard coverage |
| Frontend-only checks | Documented as non-controls. All checks are duplicated server-side |

Residual risk: logic bugs in policy code. These are mitigated by a policy test matrix (SR-10).

### 4.3 Replay attacks and MFA abuse
| Threat | Mitigation |
|---|---|
| Replay of a WebAuthn assertion | Server-generated 32-byte challenge, single-use (atomic consume), 5 min TTL, bound to its purpose (`REGISTER`/`LOGIN`/`ADD_PASSKEY`) and to the user where known. Origin and RP ID are checked. Sign-counter regression raises an alert |
| TOTP code replay | Store `last_used_step`. Reject any step ≤ last. Window ±1 step |
| TOTP brute force | 5 failures kill the pending session. 10 per hour lock the account and raise an alert. IP and account rate limits apply |
| TOTP secret theft | Encrypted with a KEK-derived subkey. Returned only during unconfirmed enrollment and never again. Never logged |
| Authenticator fatigue or social-engineered resets | Only ADMIN can reset credentials (step-up, reason required, audited, alert raised) |

Residual risk: TOTP can be phished in real time. Passkeys mitigate this because the first factor is phishing-resistant. Admin reset is a social-engineering target.

### 4.4 Malicious uploads and unauthorized downloads
| Threat | Mitigation |
|---|---|
| Executable or polyglot uploads | Extension **and** magic-byte allowlist. Archives are rejected. Files are never executed or rendered server-side |
| Stored XSS through download | `Content-Disposition: attachment`, `nosniff`, a sanitized filename, and a server-chosen `Content-Type` |
| Path traversal or object-key injection | Object keys are random UUIDs. User filenames exist only as metadata |
| Resource exhaustion | 25 MB cap enforced while streaming. Upload and download rate limits |
| Direct MinIO access | MinIO is not exposed to clients. Bucket is private. No presigned URLs. Objects are ciphertext anyway |
| Downloading without a grant | Owner-or-active-grant check on every request. Frozen and unconfirmed assets are blocked. Denials are audited and alerted in bursts |
| Ciphertext swapping between assets | GCM AAD = `assetId\|versionId` |

Residual risk: malware hidden inside allowed formats (PDF, STEP). AV scanning (ClamAV) is not in the MVP. Authorized users can exfiltrate plaintext they legitimately downloaded.

### 4.5 Encryption key exposure
| Threat | Mitigation |
|---|---|
| KEK committed to git | Generated by a script into git-ignored `infra/secrets/`. A pre-commit or CI secret scan (gitleaks) is planned. The repo is **public**, so this is high priority |
| KEK in logs or errors | No crypto material in logs. A logger redaction list is applied. Errors are generic |
| DB dump reveals keys | DEKs and TOTP secrets are wrapped. The KEK is not in the DB |
| IV reuse under GCM | Random 96-bit IV per encryption with a fresh DEK per version, so (key, IV) pairs do not repeat |
| Fabric client key theft | Mounted read-only from git-ignored paths. Production would use HSM/KMS |
| Host compromise | Out of scope for the MVP. Production would use KMS/Vault with envelope decryption |

Residual risk: in development the KEK sits in process memory and in env or secret files. Anyone with root on the host can recover it.

### 4.6 Blockchain and database inconsistencies
| Threat | Mitigation |
|---|---|
| DB write succeeds but the ledger write fails | Transactional outbox with retry. Assets stay `PENDING` and cannot be downloaded until `CONFIRMED`. After repeated failure the status becomes `FAILED` and an alert is raised |
| DB tampered to change the stored hash | Downloads and verifications compare against the **ledger** hash, not just the DB copy |
| Ledger and DB diverge on grants | Reconciliation job raises `LEDGER_DIVERGENCE`. Revocation is effective in the DB first (fail-safe direction) |
| Ledger unavailable | Downloads fail closed (`503`) |
| Forged chaincode calls | Chaincode checks caller MSP and the `aegis.role=api` attribute. It enforces no overwrite, immutable hashes, terminal revocation, and tx timestamps |
| Chaincode trusts the API-asserted actor DID | Documented limitation. Chaincode cannot prove which end user acted. A compromised API can write false but well-formed records |
| "Immutable ledger ⇒ true data" fallacy | Documentation and UI must say the ledger proves *what was registered and when*, not that the content is correct |

Residual risk: a single-org dev network gives no decentralization. Ledger immutability is only as strong as the endorsement policy and the set of orgs running peers.

### 4.7 Audit-log tampering
| Threat | Mitigation |
|---|---|
| App or SQL injection modifying audit rows | App DB role has only `INSERT, SELECT`. Triggers block `UPDATE/DELETE/TRUNCATE` |
| DBA rewriting history | Hash chain plus periodic ledger anchors. `/audit/verify` detects rewrites before the last anchor |
| Truncating recent events | Detectable only up to the last anchor. The anchor interval (≤5 min / 100 events) bounds the exposure |
| Log injection | Details are stored as structured JSONB and never concatenated into strings |

### 4.8 Expired or revoked permissions
| Threat | Mitigation |
|---|---|
| Expired grant still used | `expires_at > now()` is checked live on each download. Validity does not depend on a cron sweep |
| Revocation delayed by the chain | Revocation commits to Postgres synchronously before the response. The ledger copy is asynchronous |
| Revoked user's sessions | Suspend or lock deletes sessions. Each request re-checks user status |
| Plaintext already downloaded | **Cannot be recalled.** Mitigations are audit trails, time-boxed grants, and watermarking (future) |

### 4.9 Insider threats and administrator abuse
| Threat | Mitigation |
|---|---|
| ADMIN grants themselves document access | ADMIN has no content rights and cannot approve requests. A self role change is blocked |
| ADMIN promotes an accomplice | Step-up required, `PRIVILEGED_ROLE_GRANTED` alert raised to SECURITY_OFFICER, ledger-anchored audit |
| ADMIN resets a victim's credentials to take over the account | Reset raises a `CREDENTIALS_RESET` alert. The new invite is visible only to the admin, so an alert plus out-of-band confirmation is required. **Residual:** a two-person rule is a [DECISION] |
| SECURITY_OFFICER abuse (locks, freezes) | Step-up, audit, and no self-unlock. Cannot change roles or download without a grant |
| Manager rubber-stamping requests | Maximum grant duration, required reasons, AUDITOR visibility |
| Collusion of ADMIN + DBA + host root | Not fully mitigable in the MVP. Ledger anchors make history rewrites detectable |

## 5. Testable security requirements
| ID | Requirement | Test type |
|---|---|---|
| SR-01 | Every non-`@Public` route returns 401 without a session | Integration (route enumeration) |
| SR-02 | `MFA_PENDING` and `ENROLLMENT_PENDING` sessions get 401 on all routes except their allowlist | Integration |
| SR-03 | A WebAuthn challenge cannot be used twice, after expiry, or for a different purpose | Unit + integration |
| SR-04 | A TOTP code is rejected when its time-step ≤ last used step. The 10th failure locks the account | Unit + integration |
| SR-05 | Session token rotates on login and step-up. The old token returns 401 | Integration |
| SR-06 | Mutating requests without a valid `X-CSRF-Token` return 403 | Integration |
| SR-07 | Only SHA-256(session token) is stored. The DB never contains the raw token | Unit |
| SR-08 | TOTP secret is never returned after enrollment confirmation and is stored encrypted | Integration |
| SR-09 | Uploads with disallowed magic bytes or extension return 415. Files over the limit return 413 | Integration |
| SR-10 | Policy matrix: every role × {owner, grantee, same-dept, other-dept} × {download, approve, revoke, verify} produces the expected result | Integration (table-driven) |
| SR-11 | A revoked grant blocks download in the very next request, even when the ledger is down | Integration |
| SR-12 | An expired grant blocks download without any sweep job running | Integration (clock control) |
| SR-13 | Self-approval, self role change, self-unlock, and ADMIN content download are rejected | Integration |
| SR-14 | Tampering with ciphertext in MinIO yields 409 INTEGRITY_FAILURE and a CRITICAL alert, and releases no bytes | Integration |
| SR-15 | Changing the DB hash with the ledger unchanged is detected on download and verify | Integration |
| SR-16 | Swapping two objects' ciphertexts fails decryption (AAD) | Unit |
| SR-17 | Audit `UPDATE`/`DELETE` by the app role fails. Modifying a row makes `/audit/verify` report `firstBrokenSeq` | Integration |
| SR-18 | No key, secret, token, or TOTP code appears in logs (log capture assertion) | Integration |
| SR-19 | Ledger payloads contain no PII, keys, or content (chaincode arg schema test) | Unit (Go + TS) |
| SR-20 | Chaincode rejects asset id overwrite, hash change, un-revoking, and grants with expiry ≤ tx time | Go unit |
| SR-21 | Asset download is blocked while `chainStatus != CONFIRMED` and when the asset is frozen | Integration |
| SR-22 | App refuses to start with `LEDGER_DRIVER=memory` in production, or with a missing or short KEK | Unit |
| SR-23 | Auth endpoints rate-limit (429) | Integration |
| SR-24 | No secrets are tracked in git (gitleaks in CI or pre-commit) | CI |
