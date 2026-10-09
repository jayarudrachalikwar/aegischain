import type { UserRole } from '../api/types';

/**
 * Which roles should see each screen. Mirrors docs/API_CONTRACT.md (separation of duties):
 *  - ADMIN manages users but cannot approve access or read documents without a grant.
 *  - AUDITOR is read-only (no upload/request), SECURITY_OFFICER triages alerts.
 *  - Approvals: the asset owner (EMPLOYEE) or a MANAGER; never ADMIN.
 *
 * NOTE: this only shapes the UI. The backend is the sole security control and must enforce
 * the same rules on every request (frontend role checks are not security).
 */
const ALL: UserRole[] = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'];

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ALL,
  '/assets': ALL,
  '/upload': ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SECURITY_OFFICER'],
  '/request-access': ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SECURITY_OFFICER'],
  '/approvals': ['EMPLOYEE', 'MANAGER'],
  '/access-management': ALL,
  '/audit-logs': ['AUDITOR', 'SECURITY_OFFICER'],
  '/security-alerts': ['SECURITY_OFFICER', 'AUDITOR'],
  '/users': ['ADMIN'],
  '/passkeys': ALL,
  '/mfa': ALL,
  '/profile': ALL,
};
