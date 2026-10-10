import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { Public } from './guards/public.decorator';
import { ChallengeService } from './challenge.service';
import { WebAuthnService } from './webauthn.service';
import { SessionService } from './session.service';
import type { SessionRequest } from './guards/session.guard';
import type { User } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterOptionsDto, RegisterVerifyDto, LoginOptionsDto, LoginVerifyDto } from './auth.dto';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly challenges: ChallengeService,
    private readonly webauthn: WebAuthnService,
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Get('session')
  async getSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const csrfToken = randomBytes(32).toString('base64url');
    this.sessions.setCsrfCookie(res, csrfToken);

    const sid = (req.cookies as Record<string, string> | undefined)?.['aegis_sid'];
    if (!sid) return { state: 'ANONYMOUS' };

    const tokenHash = createHash('sha256').update(sid).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || session.absoluteAt < new Date()) {
      return { state: 'ANONYMOUS' };
    }

    if (session.state === 'ENROLLMENT_PENDING') return { state: 'ENROLLMENT_PENDING' };
    if (session.state === 'MFA_PENDING') return { state: 'MFA_PENDING' };

    return {
      state: 'ACTIVE',
      user: formatUser(session.user),
      stepUpValidUntil: session.stepUpAt
        ? new Date(session.stepUpAt.getTime() + 5 * 60 * 1000)
        : null,
      expiresAt: session.expiresAt,
    };
  }

  // ── Registration ──────────────────────────────────────────────────────────

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('register/options')
  async registerOptions(@Body() dto: RegisterOptionsDto) {
    const invite = await this.lookupAndValidateInvite(dto.inviteToken);
    const user = invite.user;

    // Generate the challenge once, store in DB, and pass same bytes to simplewebauthn.
    const { id: challengeId, challenge } = await this.challenges.create('REGISTER', user.id);
    const challengeBytes = new Uint8Array(Buffer.from(challenge, 'base64url'));
    const opts = await this.webauthn.generateRegistrationOptions(user, challengeBytes);

    return { challengeId, publicKey: opts };
  }

  @Public()
  @Post('register/verify')
  @HttpCode(201)
  async registerVerify(@Body() dto: RegisterVerifyDto, @Res({ passthrough: true }) res: Response) {
    const invite = await this.lookupAndValidateInvite(dto.inviteToken);
    const user = invite.user;

    const expectedChallenge = await this.challenges.consume(dto.challengeId, 'REGISTER');

    await this.webauthn.verifyRegistration(
      user.id,
      expectedChallenge,
      dto.credential as unknown as RegistrationResponseJSON,
      dto.credentialName,
    );

    // Consume invite atomically
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    await this.sessions.create(user.id, 'ENROLLMENT_PENDING', res);

    await this.audit.append({
      action: 'PASSKEY_REGISTERED',
      outcome: 'SUCCESS',
      actorId: user.id,
      actorRole: user.role,
      targetType: 'user',
      targetId: user.id,
    });

    return { state: 'ENROLLMENT_PENDING' };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login/options')
  async loginOptions(@Body() dto: LoginOptionsDto) {
    let userId: string | undefined;

    if (dto.email) {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      // Never reveal whether the email exists — return same shape regardless
      userId = user?.status === 'ACTIVE' ? user.id : undefined;
    }

    const { id: challengeId, challenge } = await this.challenges.create('LOGIN');
    const challengeBytes = new Uint8Array(Buffer.from(challenge, 'base64url'));
    const opts = await this.webauthn.generateAuthenticationOptions(challengeBytes, userId);

    return { challengeId, publicKey: opts };
  }

  @Public()
  @HttpCode(200)
  @Post('login/verify')
  async loginVerify(@Body() dto: LoginVerifyDto, @Res({ passthrough: true }) res: Response) {
    const expectedChallenge = await this.challenges.consume(dto.challengeId, 'LOGIN');

    let userId: string;
    try {
      const result = await this.webauthn.verifyAuthentication(
        expectedChallenge,
        dto.credential as unknown as AuthenticationResponseJSON,
      );
      userId = result.userId;
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Authentication failed');

    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      await this.audit.append({
        action: 'LOGIN_FAILED',
        outcome: 'DENIED',
        actorId: userId,
        actorRole: user.role,
        details: { reason: 'account_locked_or_suspended' },
      });
      throw new UnauthorizedException('Authentication failed');
    }

    if (user.status === 'ENROLLMENT_PENDING') {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.sessions.create(userId, 'MFA_PENDING', res);

    await this.audit.append({
      action: 'LOGIN_SUCCEEDED',
      outcome: 'SUCCESS',
      actorId: userId,
      actorRole: user.role,
    });

    return { state: 'MFA_PENDING' };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request & Partial<SessionRequest>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.session?.id;
    if (sessionId) {
      await this.sessions.destroy(sessionId, res);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async lookupAndValidateInvite(rawToken: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!invite || invite.usedAt !== null || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Authentication failed');
    }

    return invite;
  }
}

function formatUser(user: User) {
  return {
    id: user.id,
    did: user.did,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    department: user.department,
    status: user.status,
    totpEnrolled: false, // M3 fills this
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export { formatUser };
