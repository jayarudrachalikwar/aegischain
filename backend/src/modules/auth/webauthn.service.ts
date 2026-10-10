import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { PrismaService } from '../../database/prisma.service';
import type { User, WebAuthnCredential } from '../../generated/prisma/client';

const RP_ID = process.env['WEBAUTHN_RP_ID'] ?? 'localhost';
const RP_NAME = process.env['WEBAUTHN_RP_NAME'] ?? 'AegisChain';
const ORIGIN = process.env['WEBAUTHN_ORIGIN'] ?? 'http://localhost:3000';

@Injectable()
export class WebAuthnService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRegistrationOptions(
    user: Pick<User, 'id' | 'email' | 'displayName'>,
    challengeBytes: Uint8Array<ArrayBuffer>,
  ): Promise<ReturnType<typeof generateRegistrationOptions>> {
    const existingCredentials = await this.prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true },
    });

    return generateRegistrationOptions({
      rpID: RP_ID,
      rpName: RP_NAME,
      userName: user.email,
      userDisplayName: user.displayName,
      userID: Buffer.from(user.id),
      challenge: challengeBytes,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: existingCredentials.map((c) => ({ id: c.credentialId })),
      timeout: 300_000,
    });
  }

  async verifyRegistration(
    userId: string,
    expectedChallenge: string,
    response: RegistrationResponseJSON,
    credentialName: string | undefined,
  ): Promise<WebAuthnCredential> {
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      });
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Authentication failed');
    }

    const { credential, aaguid } = verification.registrationInfo;

    return this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        name: credentialName ?? null,
        aaguid: aaguid ?? null,
        lastUsedAt: new Date(),
      },
    });
  }

  async generateAuthenticationOptions(
    challengeBytes: Uint8Array<ArrayBuffer>,
    userId?: string,
  ): Promise<ReturnType<typeof generateAuthenticationOptions>> {
    let allowCredentials: { id: string }[] = [];

    if (userId) {
      const creds = await this.prisma.webAuthnCredential.findMany({
        where: { userId },
        select: { credentialId: true },
      });
      allowCredentials = creds.map((c) => ({ id: c.credentialId }));
    }

    return generateAuthenticationOptions({
      rpID: RP_ID,
      challenge: challengeBytes,
      userVerification: 'required',
      allowCredentials,
      timeout: 300_000,
    });
  }

  async verifyAuthentication(
    expectedChallenge: string,
    response: AuthenticationResponseJSON,
  ): Promise<{ userId: string; credential: WebAuthnCredential }> {
    const stored = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: response.id },
    });
    if (!stored) throw new UnauthorizedException('Authentication failed');

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
        credential: {
          id: stored.credentialId,
          publicKey: new Uint8Array(stored.publicKey),
          counter: Number(stored.counter),
        },
      });
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    if (!verification.verified) throw new UnauthorizedException('Authentication failed');

    const newCounter = BigInt(verification.authenticationInfo.newCounter);
    const updated = await this.prisma.webAuthnCredential.update({
      where: { id: stored.id },
      data: { counter: newCounter, lastUsedAt: new Date() },
    });

    return { userId: stored.userId, credential: updated };
  }
}
