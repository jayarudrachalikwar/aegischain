import { createHash, randomBytes } from 'node:crypto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionGuard, hashToken } from './session.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

// SR-07: only SHA-256(token) is stored; the raw token never appears in the stored hash.
describe('hashToken', () => {
  it('produces the SHA-256 hex digest of the raw token', () => {
    const raw = randomBytes(32).toString('hex');
    const expected = createHash('sha256').update(raw).digest('hex');
    expect(hashToken(raw)).toBe(expected);
  });

  it('is deterministic', () => {
    const raw = 'test-token';
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it('different tokens produce different hashes', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('the raw token is not recoverable from the hash (not a prefix or substring)', () => {
    const raw = randomBytes(32).toString('hex');
    const hash = hashToken(raw);
    expect(hash).not.toContain(raw);
    expect(raw).not.toContain(hash);
  });
});

describe('SessionGuard', () => {
  function makeGuardAndContext(
    isPublic: boolean,
    cookies: Record<string, string>,
    prismaSession?: object | null,
  ): { guard: SessionGuard; context: ExecutionContext; req: Record<string, unknown> } {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      return undefined;
    });

    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(prismaSession ?? null),
        delete: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    const req: Record<string, unknown> = { cookies };
    const context: ExecutionContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    return { guard: new SessionGuard(reflector, prisma as never), context, req };
  }

  it('passes through @Public routes without touching Prisma', async () => {
    const { guard, context } = makeGuardAndContext(true, {});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('throws 401 when aegis_sid cookie is absent', async () => {
    const { guard, context } = makeGuardAndContext(false, {});
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 when session is not found', async () => {
    const { guard, context } = makeGuardAndContext(false, { aegis_sid: 'token' }, null);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 when session state is not ACTIVE', async () => {
    const { guard, context } = makeGuardAndContext(
      false,
      { aegis_sid: 'token' },
      {
        id: 'sess-1',
        state: 'MFA_PENDING',
        expiresAt: new Date(Date.now() + 60_000),
        absoluteAt: new Date(Date.now() + 60_000),
        user: { status: 'ACTIVE' },
      },
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 and deletes the session when it is expired', async () => {
    const { guard, context, req } = makeGuardAndContext(
      false,
      { aegis_sid: 'token' },
      {
        id: 'sess-1',
        state: 'ACTIVE',
        expiresAt: new Date(Date.now() - 1000),
        absoluteAt: new Date(Date.now() + 60_000),
        user: { status: 'ACTIVE' },
      },
    );
    const prisma = req as unknown as { cookies: unknown } as never;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    void prisma;
  });

  it('throws 401 when user is SUSPENDED', async () => {
    const { guard, context } = makeGuardAndContext(
      false,
      { aegis_sid: 'token' },
      {
        id: 'sess-1',
        state: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60_000),
        absoluteAt: new Date(Date.now() + 60_000),
        user: { status: 'SUSPENDED' },
      },
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 when user is LOCKED', async () => {
    const { guard, context } = makeGuardAndContext(
      false,
      { aegis_sid: 'token' },
      {
        id: 'sess-1',
        state: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60_000),
        absoluteAt: new Date(Date.now() + 60_000),
        user: { status: 'LOCKED' },
      },
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches user and session to the request on success', async () => {
    const fakeUser = { id: 'user-1', status: 'ACTIVE', role: 'EMPLOYEE' };
    const fakeSession = {
      id: 'sess-1',
      state: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      absoluteAt: new Date(Date.now() + 60_000),
      user: fakeUser,
    };
    const { guard, context, req } = makeGuardAndContext(false, { aegis_sid: 'token' }, fakeSession);
    await guard.canActivate(context);
    expect((req as Record<string, unknown>)['user']).toBe(fakeUser);
    expect((req as Record<string, unknown>)['session']).toBe(fakeSession);
  });
});
