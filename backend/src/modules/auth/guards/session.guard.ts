import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { Session, User } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ApiException } from '../../../common/api-error';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PENDING_SESSION_KEY } from './pending-session.decorator';

export interface SessionRequest extends Request {
  user: User;
  session: Session & { user: User };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

const IDLE_MS = 30 * 60 * 1000; // 30 min

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) return true;

    const pendingState = this.reflector.getAllAndOverride<string | undefined>(PENDING_SESSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<SessionRequest>();
    const raw: string | undefined = (req.cookies as Record<string, string> | undefined)?.[
      'aegis_sid'
    ];
    if (!raw) throw new ApiException(401, 'UNAUTHENTICATED', 'Authentication required');

    const tokenHash = hashToken(raw);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const now = new Date();
    if (!session || session.expiresAt < now || session.absoluteAt < now) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      throw new ApiException(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    const { user } = session;
    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      throw new ApiException(403, 'ACCOUNT_LOCKED', 'Account is locked or suspended');
    }

    if (pendingState) {
      // Route explicitly requires a specific pending state
      if (session.state !== pendingState) {
        throw new ApiException(401, 'UNAUTHENTICATED', 'Authentication required');
      }
      req.user = user;
      req.session = session;
      return true;
    }

    // Normal route: requires ACTIVE session
    if (session.state !== 'ACTIVE') {
      if (session.state === 'MFA_PENDING') {
        throw new ApiException(401, 'MFA_REQUIRED', 'MFA verification required');
      }
      if (session.state === 'ENROLLMENT_PENDING') {
        throw new ApiException(401, 'ENROLLMENT_REQUIRED', 'TOTP enrollment required');
      }
      throw new ApiException(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { idleAt: now, expiresAt: new Date(now.getTime() + IDLE_MS) },
    });

    req.user = user;
    req.session = session;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
