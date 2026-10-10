import type { Prisma } from '../../generated/prisma/client';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_SUSPENDED'
  | 'USER_REACTIVATED'
  | 'ROLE_CHANGED'
  | 'CREDENTIAL_RESET'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCEEDED'
  | 'LOGOUT'
  | 'PASSKEY_REGISTERED'
  | 'MFA_FAILED'
  | 'STEP_UP_COMPLETED'
  | 'ASSET_UPLOADED'
  | 'ASSET_DOWNLOADED'
  | 'ASSET_FROZEN'
  | 'ASSET_UNFROZEN'
  | 'ACCESS_REQUESTED'
  | 'ACCESS_APPROVED'
  | 'ACCESS_DENIED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_EXPIRED'
  | 'INTEGRITY_MISMATCH'
  | 'SECURITY_ALERT_RAISED'
  | 'SECURITY_ALERT_RESOLVED'
  | 'AUDIT_CHAIN_ANCHORED'
  | 'TOTP_ENROLLED'
  | 'ACCOUNT_LOCKED';

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'DENIED';

export interface AppendAuditEvent {
  actorId?: string;
  actorRole?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  outcome: AuditOutcome;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  details?: Prisma.InputJsonValue;
}
