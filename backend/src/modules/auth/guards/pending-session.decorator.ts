import { SetMetadata } from '@nestjs/common';

export const PENDING_SESSION_KEY = 'pendingSession';

/** Marks a route as accepting a specific pending session state instead of ACTIVE. */
export const PendingSession = (state: 'ENROLLMENT_PENDING' | 'MFA_PENDING') =>
  SetMetadata(PENDING_SESSION_KEY, state);
