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
import { PendingSession } from './guards/pending-session.decorator';
import { ChallengeService } from './challenge.service';
import { WebAuthnService } from './webauthn.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';
import type { SessionRequest } from './guards/session.guard';
import type { User } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../../common/api-error';
import {
  RegisterOptionsDto,
  RegisterVerifyDto,
  LoginOptionsDto,
  LoginVerifyDto,
  TotpCodeDto,
} from './auth.dto';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

const MFA_LOCKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MFA_SESSION_LIMIT = 5;
const MFA_ACCOUNT_LIMIT = 10;

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly challenges: ChallengeService,
    private readonly webauthn: WebAuthnService,
    private readonly sessions: SessionService,
    private readonly totp: TotpService,
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

  // ── TOTP Enrollment ───────────────────────────────────────────────────────

  @PendingSession('ENROLLMENT_PENDING')
  @HttpCode(200)
  @Post('totp/enroll')
  async totpEnroll(@Req() req: SessionRequest) {
    const { user } = req;
    const secret = this.totp.generateSecret();
    const uri = this.totp.buildUri(secret, user.email);
    const qrCodeDataUrl = await this.totp.generateQrCode(uri);

    const encryptedSecret = Buffer.from(this.totp.encryptSecret(secret));
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpPendingSecret: encryptedSecret },
    });

    // SR-08: plaintext secret returned only here, never again
    return { otpauthUri: uri, secret, qrCodeDataUrl };
  }

  @PendingSession('ENROLLMENT_PENDING')
  @HttpCode(200)
  @Post('totp/enroll/verify')
  async totpEnrollVerify(
    @Body() dto: TotpCodeDto,
    @Req() req: SessionRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = req;

    if (!user.totpPendingSecret) {
      throw new ApiException(400, 'ENROLLMENT_NOT_STARTED', 'Call POST /auth/totp/enroll first');
    }

    const pendingSecret = this.totp.decryptSecret(Buffer.from(user.totpPendingSecret));
    const result = this.totp.verify(dto.code, pendingSecret, null);

    if (!result.valid) {
      const newAttempts = session.mfaAttempts + 1;
      if (newAttempts >= MFA_SESSION_LIMIT) {
        await this.sessions.destroy(session.id, res);
        throw new ApiException(401, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts');
      }
      await this.prisma.session.update({
        where: { id: session.id },
        data: { mfaAttempts: newAttempts },
      });
      throw new ApiException(401, 'INVALID_CODE', 'Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: user.totpPendingSecret,
        totpPendingSecret: null,
        totpEnrolled: true,
        lastTotpStep: result.step!,
        status: 'ACTIVE',
      },
    });

    await this.sessions.rotate(session.id, user.id, 'ACTIVE', res);

    await this.audit.append({
      action: 'TOTP_ENROLLED',
      outcome: 'SUCCESS',
      actorId: user.id,
      actorRole: user.role,
      targetType: 'user',
      targetId: user.id,
    });

    const updatedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return { state: 'ACTIVE', user: formatUser(updatedUser) };
  }

  // ── MFA Verify ────────────────────────────────────────────────────────────

  @PendingSession('MFA_PENDING')
  @HttpCode(200)
  @Post('mfa/verify')
  async mfaVerify(
    @Body() dto: TotpCodeDto,
    @Req() req: SessionRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = req;

    if (!user.totpSecret) {
      throw new ApiException(500, 'INTERNAL_ERROR', 'TOTP not configured');
    }

    const secret = this.totp.decryptSecret(Buffer.from(user.totpSecret));
    const result = this.totp.verify(
      dto.code,
      secret,
      user.lastTotpStep !== undefined ? user.lastTotpStep : null,
    );

    if (!result.valid) {
      await this.handleMfaFailure(user.id, session.id, session.mfaAttempts, res);
    }

    // Success: clear failure counters, update lastLoginAt, lastTotpStep, rotate session
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastTotpStep: result.step!,
        mfaFailedCount: 0,
        mfaWindowStart: null,
        lastLoginAt: new Date(),
      },
    });

    await this.sessions.rotate(session.id, user.id, 'ACTIVE', res);

    await this.audit.append({
      action: 'LOGIN_SUCCEEDED',
      outcome: 'SUCCESS',
      actorId: user.id,
      actorRole: user.role,
    });

    const updatedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return { state: 'ACTIVE', user: formatUser(updatedUser) };
  }

  // ── Step-up ───────────────────────────────────────────────────────────────

  @HttpCode(200)
  @Post('step-up')
  async stepUp(
    @Body() dto: TotpCodeDto,
    @Req() req: SessionRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = req;

    if (!user.totpSecret) {
      throw new ApiException(500, 'INTERNAL_ERROR', 'TOTP not configured');
    }

    const secret = this.totp.decryptSecret(Buffer.from(user.totpSecret));
    const result = this.totp.verify(
      dto.code,
      secret,
      user.lastTotpStep !== undefined ? user.lastTotpStep : null,
    );

    if (!result.valid) {
      throw new ApiException(401, 'INVALID_CODE', 'Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastTotpStep: result.step! },
    });

    const stepUpAt = new Date();
    await this.sessions.rotate(session.id, user.id, 'ACTIVE', res, stepUpAt);

    await this.audit.append({
      action: 'STEP_UP_COMPLETED',
      outcome: 'SUCCESS',
      actorId: user.id,
      actorRole: user.role,
    });

    return { stepUpValidUntil: new Date(stepUpAt.getTime() + 5 * 60 * 1000) };
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

  private async handleMfaFailure(
    userId: string,
    sessionId: string,
    currentAttempts: number,
    res: Response,
  ): Promise<never> {
    const newAttempts = currentAttempts + 1;

    // Per-session limit: 5 failures destroy the session
    if (newAttempts >= MFA_SESSION_LIMIT) {
      await this.sessions.destroy(sessionId, res);
      throw new ApiException(401, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { mfaAttempts: newAttempts },
    });

    // Per-account hourly limit: 10 failures lock the account
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const now = new Date();
    const windowExpired =
      !user.mfaWindowStart || now.getTime() - user.mfaWindowStart.getTime() > MFA_LOCKOUT_WINDOW_MS;

    const newCount = windowExpired ? 1 : user.mfaFailedCount + 1;
    const windowStart = windowExpired ? now : user.mfaWindowStart!;

    if (newCount >= MFA_ACCOUNT_LIMIT) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'LOCKED', mfaFailedCount: newCount, mfaWindowStart: windowStart },
      });
      await this.audit.append({
        action: 'ACCOUNT_LOCKED',
        outcome: 'SUCCESS',
        actorId: userId,
        actorRole: user.role,
        details: { reason: 'too_many_mfa_failures' },
      });
      throw new ApiException(403, 'ACCOUNT_LOCKED', 'Account locked due to too many failures');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaFailedCount: newCount, mfaWindowStart: windowStart },
    });

    throw new ApiException(401, 'INVALID_CODE', 'Invalid TOTP code');
  }

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
    totpEnrolled: user.totpEnrolled,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export { formatUser };
