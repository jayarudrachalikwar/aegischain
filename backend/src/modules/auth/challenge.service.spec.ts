import { UnauthorizedException } from '@nestjs/common';
import { ChallengeService } from './challenge.service';

function makePrisma(
  overrides: Partial<{
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  }> = {},
) {
  return {
    challenge: {
      create:
        overrides.create ??
        jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => ({
          id: 'challenge-1',
          ...args.data,
        })),
      findUnique: overrides.findUnique ?? jest.fn(),
      update: overrides.update ?? jest.fn().mockResolvedValue({}),
    },
  };
}

describe('ChallengeService', () => {
  describe('create', () => {
    it('stores the challenge and returns id + challenge string', async () => {
      const prisma = makePrisma();
      const svc = new ChallengeService(prisma as never);
      const result = await svc.create('LOGIN');
      expect(result.id).toBe('challenge-1');
      expect(typeof result.challenge).toBe('string');
      expect(result.challenge.length).toBeGreaterThan(20);
      expect(prisma.challenge.create).toHaveBeenCalledTimes(1);
    });

    it('uses a fresh random challenge each call', async () => {
      const created: string[] = [];
      const prisma = makePrisma({
        create: jest.fn().mockImplementation((args: { data: { challenge: string } }) => {
          created.push(args.data.challenge);
          return { id: `c-${created.length}`, ...args.data };
        }),
      });
      const svc = new ChallengeService(prisma as never);
      const r1 = await svc.create('REGISTER');
      const r2 = await svc.create('REGISTER');
      expect(r1.challenge).not.toBe(r2.challenge);
    });
  });

  describe('consume (SR-03)', () => {
    it('marks the challenge used and returns its value on success', async () => {
      const record = {
        id: 'c-1',
        challenge: 'abc123',
        scope: 'LOGIN' as const,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(record) });
      const svc = new ChallengeService(prisma as never);
      const ch = await svc.consume('c-1', 'LOGIN');
      expect(ch).toBe('abc123');
      expect(prisma.challenge.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c-1' } }),
      );
    });

    it('rejects a non-existent challenge (SR-03)', async () => {
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(null) });
      const svc = new ChallengeService(prisma as never);
      await expect(svc.consume('missing', 'LOGIN')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a challenge with wrong scope (SR-03)', async () => {
      const record = {
        id: 'c-1',
        challenge: 'abc',
        scope: 'REGISTER' as const,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(record) });
      const svc = new ChallengeService(prisma as never);
      await expect(svc.consume('c-1', 'LOGIN')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an already-used challenge (SR-03: single-use)', async () => {
      const record = {
        id: 'c-1',
        challenge: 'abc',
        scope: 'LOGIN' as const,
        usedAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 60_000),
      };
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(record) });
      const svc = new ChallengeService(prisma as never);
      await expect(svc.consume('c-1', 'LOGIN')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired challenge (SR-03: 5-min TTL)', async () => {
      const record = {
        id: 'c-1',
        challenge: 'abc',
        scope: 'LOGIN' as const,
        usedAt: null,
        expiresAt: new Date(Date.now() - 1), // just expired
      };
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(record) });
      const svc = new ChallengeService(prisma as never);
      await expect(svc.consume('c-1', 'LOGIN')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects challenge bound to a different purpose even with correct scope (SR-03: purpose binding)', async () => {
      // Same scope string used for both LOGIN and ADD_PASSKEY would be a bug;
      // here we verify REGISTER scope challenge can't be consumed as ADD_PASSKEY
      const record = {
        id: 'c-1',
        challenge: 'abc',
        scope: 'REGISTER' as const,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const prisma = makePrisma({ findUnique: jest.fn().mockResolvedValue(record) });
      const svc = new ChallengeService(prisma as never);
      await expect(svc.consume('c-1', 'ADD_PASSKEY')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
