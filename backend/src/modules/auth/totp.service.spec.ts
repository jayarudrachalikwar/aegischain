/**
 * Unit tests for TotpService.
 * otplib is mocked to avoid ESM/CommonJS incompatibilities in Jest.
 * The mock makes verify() fully deterministic: generateSync returns `code-{counter}`.
 */

// Must be hoisted before imports
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'TESTBASE32SECRETVALUE12345678'),
  generateSync: jest.fn(({ counter }: { counter: number; strategy: string }) => `code-${counter}`),
  generateURI: jest.fn(
    ({ issuer, label }: { issuer: string; label: string; secret: string }) =>
      `otpauth://totp/${issuer}:${label}?secret=TEST`,
  ),
}));

jest.mock('qrcode', () => {
  const toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,FAKE');
  return { toDataURL, default: { toDataURL } };
});

import { generateSync } from 'otplib';
import { TotpService } from './totp.service';
import type { KekService } from '../crypto/kek.service';

const mockKek: KekService = {
  encryptTotp: (buf: Buffer) => buf,
  decryptTotp: (buf: Buffer) => buf,
} as unknown as KekService;

const PERIOD = 30;
function currentStep(): number {
  return Math.floor(Date.now() / 1000 / PERIOD);
}

describe('TotpService', () => {
  let svc: TotpService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new TotpService(mockKek);
  });

  describe('generateSecret', () => {
    it('returns the mock secret', () => {
      expect(svc.generateSecret()).toBe('TESTBASE32SECRETVALUE12345678');
    });
  });

  describe('buildUri', () => {
    it('builds an otpauth URI with the issuer and label', () => {
      const uri = svc.buildUri('TESTSECRET', 'user@test.com');
      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain('AegisChain');
      expect(uri).toContain('user@test.com');
    });
  });

  describe('generateQrCode', () => {
    it('returns a data-url string', async () => {
      const url = await svc.generateQrCode('otpauth://totp/test');
      expect(url).toBe('data:image/png;base64,FAKE');
    });
  });

  describe('encryptSecret / decryptSecret (identity kek)', () => {
    it('round-trips the plaintext', () => {
      const secret = 'MYSECRET';
      expect(svc.decryptSecret(svc.encryptSecret(secret))).toBe(secret);
    });
  });

  describe('verify', () => {
    // With mock: generateSync({ strategy:'hotp', counter:N }) returns 'code-N'

    it('accepts a valid current-step code', () => {
      const step = currentStep();
      const result = svc.verify(`code-${step}`, 'any', null);
      expect(result.valid).toBe(true);
      expect(result.step).toBe(BigInt(step));
    });

    it('accepts a code from the previous time-step (window=1)', () => {
      const step = currentStep() - 1;
      const result = svc.verify(`code-${step}`, 'any', null);
      expect(result.valid).toBe(true);
    });

    it('accepts a code from the next time-step (window=1)', () => {
      const step = currentStep() + 1;
      const result = svc.verify(`code-${step}`, 'any', null);
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid code (not in window)', () => {
      const step = currentStep();
      const result = svc.verify(`code-${step - 5}`, 'any', null);
      expect(result.valid).toBe(false);
      expect(result.replay).toBeUndefined();
    });

    it('rejects replay of the same step (lastStep === returned step)', () => {
      const step = currentStep();
      // First use succeeds
      const first = svc.verify(`code-${step}`, 'any', null);
      expect(first.valid).toBe(true);
      // Replay: lastStep = step that was just used
      const replay = svc.verify(`code-${step}`, 'any', first.step!);
      expect(replay.valid).toBe(false);
      expect(replay.replay).toBe(true);
    });

    it('rejects a code whose step is older than lastStep', () => {
      const step = currentStep();
      // Previous-window code with a lastStep equal to current step (= step > prevStep)
      const result = svc.verify(`code-${step - 1}`, 'any', BigInt(step));
      expect(result.valid).toBe(false);
      expect(result.replay).toBe(true);
    });

    it('allows a previous-window code when its step > lastStep', () => {
      const step = currentStep();
      // Prev step code, with lastStep one step older
      const result = svc.verify(`code-${step - 1}`, 'any', BigInt(step - 2));
      expect(result.valid).toBe(true);
    });

    it('calls generateSync for each step in the window', () => {
      const step = currentStep();
      svc.verify('no-match', 'any', null);
      expect(generateSync).toHaveBeenCalledTimes(3); // steps -1, 0, +1
      expect(generateSync).toHaveBeenCalledWith({ secret: 'any', strategy: 'hotp', counter: step - 1 });
      expect(generateSync).toHaveBeenCalledWith({ secret: 'any', strategy: 'hotp', counter: step });
      expect(generateSync).toHaveBeenCalledWith({ secret: 'any', strategy: 'hotp', counter: step + 1 });
    });
  });
});
