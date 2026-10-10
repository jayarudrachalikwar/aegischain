import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { Session, User } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

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

    const req = context.switchToHttp().getRequest<SessionRequest>();
    const raw: string | undefined = (req.cookies as Record<string, string> | undefined)?.[
      'aegis_sid'
    ];
    if (!raw) throw new UnauthorizedException();

    const tokenHash = hashToken(raw);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.state !== 'ACTIVE') throw new UnauthorizedException();

    const now = new Date();
    if (session.expiresAt < now || session.absoluteAt < now) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      throw new UnauthorizedException();
    }

    const { status } = session.user;
    if (status === 'SUSPENDED' || status === 'LOCKED') throw new UnauthorizedException();

    await this.prisma.session.update({
      where: { id: session.id },
      data: { idleAt: now, expiresAt: new Date(now.getTime() + IDLE_MS) },
    });

    req.user = session.user;
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
