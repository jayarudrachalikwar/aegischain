import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import type { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import type { SessionState } from '../../generated/prisma/client';

const IDLE_MS = 30 * 60 * 1000; // 30 min
const ABS_MS = 8 * 60 * 60 * 1000; // 8 h
const MFA_PENDING_MS = 5 * 60 * 1000; // 5 min for MFA_PENDING sessions

const IS_PROD = process.env['NODE_ENV'] === 'production';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new session in the given state, set cookies on the response. */
  async create(
    userId: string,
    state: SessionState,
    res: Response,
  ): Promise<{ rawToken: string; csrfToken: string }> {
    const rawToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const ttl = state === 'MFA_PENDING' ? MFA_PENDING_MS : IDLE_MS;
    const now = new Date();

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        state,
        expiresAt: new Date(now.getTime() + ttl),
        absoluteAt: new Date(now.getTime() + ABS_MS),
        idleAt: now,
      },
    });

    this.setCookies(res, rawToken, csrfToken);
    return { rawToken, csrfToken };
  }

  /** Rotate a session to a new state (new token, new CSRF). Old session deleted atomically. */
  async rotate(
    oldSessionId: string,
    userId: string,
    newState: SessionState,
    res: Response,
    stepUpAt?: Date,
  ): Promise<{ rawToken: string; csrfToken: string }> {
    const rawToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const ttl = newState === 'MFA_PENDING' ? MFA_PENDING_MS : IDLE_MS;
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.session.delete({ where: { id: oldSessionId } }),
      this.prisma.session.create({
        data: {
          userId,
          tokenHash,
          state: newState,
          stepUpAt: stepUpAt ?? null,
          expiresAt: new Date(now.getTime() + ttl),
          absoluteAt: new Date(now.getTime() + ABS_MS),
          idleAt: now,
        },
      }),
    ]);

    this.setCookies(res, rawToken, csrfToken);
    return { rawToken, csrfToken };
  }

  /** Delete a session and clear cookies. */
  async destroy(sessionId: string, res: Response): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    this.clearCookies(res);
  }

  /** Issue or refresh the CSRF cookie without touching the session. */
  setCsrfCookie(res: Response, csrfToken: string): void {
    res.cookie('aegis_csrf', csrfToken, {
      httpOnly: false, // JS needs to read this
      secure: IS_PROD,
      sameSite: 'strict',
      path: '/',
    });
  }

  private setCookies(res: Response, rawToken: string, csrfToken: string): void {
    res.cookie('aegis_sid', rawToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      path: '/',
    });
    this.setCsrfCookie(res, csrfToken);
  }

  private clearCookies(res: Response): void {
    res.clearCookie('aegis_sid', { path: '/' });
    res.clearCookie('aegis_csrf', { path: '/' });
  }
}
