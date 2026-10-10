import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv, hkdfSync } from 'node:crypto';
import { APP_CONFIG } from '../../config/config.module';
import type { AppConfig } from '../../config/env';

const TOTP_INFO = Buffer.from('aegischain-totp-v1');
const IV_LEN = 12;
const TAG_LEN = 16;

@Injectable()
export class KekService {
  private readonly totpKey: Buffer;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    const kek = Buffer.from(config.AEGIS_KEK_V1, 'base64');
    this.totpKey = Buffer.from(hkdfSync('sha256', kek, Buffer.alloc(0), TOTP_INFO, 32));
  }

  // Returns iv(12) || ciphertext || tag(16)
  encryptTotp(plaintext: Buffer): Buffer {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv('aes-256-gcm', this.totpKey, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([iv, ct, cipher.getAuthTag()]);
  }

  // Expects iv(12) || ciphertext || tag(16)
  decryptTotp(blob: Buffer): Buffer {
    const iv = blob.subarray(0, IV_LEN);
    const tag = blob.subarray(blob.length - TAG_LEN);
    const ct = blob.subarray(IV_LEN, blob.length - TAG_LEN);
    const decipher = createDecipheriv('aes-256-gcm', this.totpKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }
}
