import { Injectable } from '@nestjs/common';
import { generateSecret, generateSync, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { KekService } from '../crypto/kek.service';

const ISSUER = 'AegisChain';
const PERIOD = 30;
const WINDOW = 1; // ±1 time-step

export interface TotpVerifyResult {
  valid: boolean;
  step?: bigint;
  replay?: boolean;
}

@Injectable()
export class TotpService {
  constructor(private readonly kek: KekService) {}

  generateSecret(): string {
    return generateSecret();
  }

  buildUri(secret: string, email: string): string {
    return generateURI({ issuer: ISSUER, label: email, secret });
  }

  async generateQrCode(uri: string): Promise<string> {
    return QRCode.toDataURL(uri);
  }

  encryptSecret(secret: string): Buffer {
    return this.kek.encryptTotp(Buffer.from(secret, 'utf8'));
  }

  decryptSecret(encrypted: Buffer): string {
    return this.kek.decryptTotp(encrypted).toString('utf8');
  }

  // Verifies code within ±1 time-step window. Rejects step ≤ lastStep (replay prevention).
  verify(code: string, secret: string, lastStep: bigint | null): TotpVerifyResult {
    const currentStep = Math.floor(Date.now() / 1000 / PERIOD);
    for (let d = -WINDOW; d <= WINDOW; d++) {
      const s = currentStep + d;
      if (generateSync({ secret, strategy: 'hotp', counter: s }) === code) {
        if (lastStep !== null && BigInt(s) <= lastStep) {
          return { valid: false, replay: true };
        }
        return { valid: true, step: BigInt(s) };
      }
    }
    return { valid: false };
  }
}
