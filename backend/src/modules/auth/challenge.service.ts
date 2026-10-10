import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { ChallengeScope } from '../../generated/prisma/client';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 min per spec

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    scope: ChallengeScope,
    userId?: string,
    challenge?: string,
  ): Promise<{ id: string; challenge: string }> {
    const challengeValue = challenge ?? randomBytes(32).toString('base64url');
    const record = await this.prisma.challenge.create({
      data: {
        challenge: challengeValue,
        scope,
        userId: userId ?? null,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });
    return { id: record.id, challenge: challengeValue };
  }

  /**
   * Atomically consume a challenge: verify id, scope, expiry, and single-use.
   * Throws UnauthorizedException on any failure (constant message to avoid oracle).
   */
  async consume(id: string, scope: ChallengeScope): Promise<string> {
    const record = await this.prisma.challenge.findUnique({ where: { id } });

    if (
      !record ||
      record.scope !== scope ||
      record.usedAt !== null ||
      record.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.prisma.challenge.update({ where: { id }, data: { usedAt: new Date() } });
    return record.challenge;
  }
}
