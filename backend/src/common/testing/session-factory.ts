import { randomBytes } from 'node:crypto';
import type { Session, User, UserRole } from '../../generated/prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../../modules/auth/guards/session.guard';

export interface TestSession {
  rawToken: string;
  csrfToken: string;
  session: Session;
  user: User;
  /** Value for the Cookie header: `aegis_sid=<token>; aegis_csrf=<csrf>` */
  cookieHeader: string;
}

export async function createTestSession(
  prisma: PrismaService,
  opts: { role?: UserRole; email?: string; department?: string } = {},
): Promise<TestSession> {
  const rawToken = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      email: opts.email ?? `test-${randomBytes(4).toString('hex')}@example.com`,
      displayName: 'Test User',
      department: opts.department ?? 'Engineering',
      role: opts.role ?? 'EMPLOYEE',
      status: 'ACTIVE',
      did: `did:aegis:${randomBytes(16).toString('hex')}`,
    },
  });

  const session = await prisma.session.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId: user.id,
      state: 'ACTIVE',
      absoluteAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    },
  });

  return {
    rawToken,
    csrfToken,
    session,
    user,
    cookieHeader: `aegis_sid=${rawToken}; aegis_csrf=${csrfToken}`,
  };
}
