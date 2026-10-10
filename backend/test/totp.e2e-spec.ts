/**
 * M3 integration tests — run only with E2E_REAL_INFRA=1.
 *
 * Verifies: SR-02, SR-04, SR-05, SR-08, SR-18
 *   SR-02: Pending sessions blocked on normal routes with correct error codes
 *   SR-04: TOTP replay rejected; 5-failure session lockout; 10/hour account lockout
 *   SR-05: Session token invalidated on every auth state change
 *   SR-08: TOTP secret only returned by totp/enroll, never by totp/enroll/verify
 *   SR-18: TOTP code never appears in console output
 */
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { generateSync } from 'otplib';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { createSoftAuthenticator } from './helpers/soft-authenticator';
import { createHash, randomBytes } from 'node:crypto';
import { testEnv } from './helpers';

const REAL_INFRA = process.env['E2E_REAL_INFRA'] === '1';
const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:3000';
const PERIOD = 30;

function totpCode(secret: string, offset = 0): string {
  return generateSync({
    secret,
    strategy: 'hotp',
    counter: Math.floor(Date.now() / 1000 / PERIOD) + offset,
  });
}

/**
 * Extract aegis_sid and aegis_csrf from Set-Cookie headers.
 * Returns a combined Cookie header string (both name=value pairs) plus the
 * raw csrfToken value for use in X-CSRF-Token header.
 */
function parseCookies(setCookieHeaders: unknown): {
  cookieHeader: string;
  csrfToken: string;
} {
  const headers: string[] = Array.isArray(setCookieHeaders)
    ? (setCookieHeaders as string[])
    : typeof setCookieHeaders === 'string'
      ? [setCookieHeaders as string]
      : [];

  const sidHeader = headers.find((c) => c.startsWith('aegis_sid=')) ?? '';
  const csrfHeader = headers.find((c) => c.startsWith('aegis_csrf=')) ?? '';

  const sidPair = sidHeader.split(';')[0] ?? ''; // "aegis_sid=TOKEN"
  const csrfPair = csrfHeader.split(';')[0] ?? ''; // "aegis_csrf=TOKEN"
  const csrfToken = csrfPair.split('=')[1] ?? '';

  return { cookieHeader: `${sidPair}; ${csrfPair}`, csrfToken };
}

(REAL_INFRA ? describe : describe.skip)('M3: TOTP enrollment, MFA, step-up (real infra)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  beforeAll(async () => {
    testEnv({
      DATABASE_URL:
        process.env['DATABASE_URL'] ??
        'postgresql://aegis:aegis_dev_only@127.0.0.1:55432/aegischain',
      WEBAUTHN_RP_ID: RP_ID,
      WEBAUTHN_ORIGIN: ORIGIN,
      WEBAUTHN_RP_NAME: 'AegisChain Test',
    });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.$executeRaw`ALTER TABLE audit_events DISABLE TRIGGER ALL`;
    await prisma.$executeRaw`DELETE FROM audit_events WHERE "actorId" IN (SELECT id FROM users WHERE email LIKE '%@m3test.aegis')`;
    await prisma.$executeRaw`ALTER TABLE audit_events ENABLE TRIGGER ALL`;
    await prisma.challenge.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.webAuthnCredential.deleteMany({});
    await prisma.invite.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: '@m3test.aegis' } } });
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function createTestUser(email: string) {
    const id = crypto.randomUUID();
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await prisma.user.create({
      data: {
        id,
        email,
        displayName: 'Test',
        role: 'EMPLOYEE',
        status: 'ENROLLMENT_PENDING',
        did: `did:aegis:${id}`,
      },
    });
    await prisma.invite.create({
      data: {
        userId: id,
        createdById: id,
        tokenHash,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      },
    });
    return { id, inviteToken: rawToken };
  }

  /** Registers a passkey; returns ENROLLMENT_PENDING session cookies. */
  async function registerPasskey(email: string) {
    const { id: userId, inviteToken } = await createTestUser(email);
    const auth = createSoftAuthenticator();

    const optRes = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    const { challengeId, publicKey } = optRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };
    const credential = await auth.register({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId,
    });
    const verRes = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId, credential });

    const { cookieHeader, csrfToken } = parseCookies(verRes.headers['set-cookie']);
    return { userId, auth, cookieHeader, csrfToken };
  }

  /** Full enrollment: register + enroll TOTP. Returns ACTIVE session cookies + plain secret. */
  async function enrollTotp(email: string) {
    const {
      userId,
      auth,
      cookieHeader: enrollCookie,
      csrfToken: enrollCsrf,
    } = await registerPasskey(email);

    const enrollRes = await request(server)
      .post('/api/v1/auth/totp/enroll')
      .set('Cookie', enrollCookie)
      .set('X-CSRF-Token', enrollCsrf)
      .send();
    expect(enrollRes.status).toBe(200);
    const { secret } = enrollRes.body as { secret: string };

    const verifyRes = await request(server)
      .post('/api/v1/auth/totp/enroll/verify')
      .set('Cookie', enrollCookie)
      .set('X-CSRF-Token', enrollCsrf)
      .send({ code: totpCode(secret) });
    expect(verifyRes.status).toBe(200);

    const { cookieHeader, csrfToken } = parseCookies(verifyRes.headers['set-cookie']);
    return { userId, auth, secret, cookieHeader, csrfToken };
  }

  /** Passkey login for an enrolled user; returns MFA_PENDING session cookies. */
  async function loginPasskey(auth: ReturnType<typeof createSoftAuthenticator>, email: string) {
    const loginOptRes = await request(server).post('/api/v1/auth/login/options').send({ email });
    const { challengeId, publicKey } = loginOptRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };
    const assertion = await auth.authenticate({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
    });
    const loginVerRes = await request(server)
      .post('/api/v1/auth/login/verify')
      .send({ challengeId, credential: assertion });
    expect(loginVerRes.status).toBe(200);

    const { cookieHeader, csrfToken } = parseCookies(loginVerRes.headers['set-cookie']);
    return { cookieHeader, csrfToken };
  }

  // ── Enrollment tests ─────────────────────────────────────────────────────────

  describe('TOTP enrollment', () => {
    it('totp/enroll returns otpauthUri, secret, and qrCodeDataUrl', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('enroll1@m3test.aegis');
      const res = await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
      expect(res.body.secret).toMatch(/^[A-Z2-7]+=*$/);
      expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('enroll/verify: valid code → ACTIVE session, totpEnrolled = true', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('enroll2@m3test.aegis');

      const enrollRes = await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send();
      const { secret } = enrollRes.body as { secret: string };

      const verRes = await request(server)
        .post('/api/v1/auth/totp/enroll/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: totpCode(secret) });

      expect(verRes.status).toBe(200);
      expect(verRes.body.state).toBe('ACTIVE');
      expect(verRes.body.user.totpEnrolled).toBe(true);
      // New session cookie issued (SR-05: session rotated)
      const newCookies = parseCookies(verRes.headers['set-cookie']);
      expect(newCookies.cookieHeader).toContain('aegis_sid=');
    });

    it('SR-08: enroll/verify does NOT return the TOTP secret', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('enroll3@m3test.aegis');

      const enrollRes = await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send();
      const { secret } = enrollRes.body as { secret: string };

      const verRes = await request(server)
        .post('/api/v1/auth/totp/enroll/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: totpCode(secret) });

      expect(verRes.body.secret).toBeUndefined();
      expect(JSON.stringify(verRes.body)).not.toContain(secret);
    });

    it('SR-05: enrollment session token invalidated after enroll/verify', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('enroll4@m3test.aegis');

      const enrollRes = await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send();
      const { secret } = enrollRes.body as { secret: string };

      const verRes = await request(server)
        .post('/api/v1/auth/totp/enroll/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: totpCode(secret) });
      expect(verRes.status).toBe(200);

      // Old token must be rejected now (GET /session uses the sid cookie, no CSRF needed)
      const sidOnly = cookieHeader.split(';')[0]; // just "aegis_sid=..."
      const replayRes = await request(server).get('/api/v1/auth/session').set('Cookie', sidOnly);
      expect(replayRes.body.state).toBe('ANONYMOUS');
    });

    it('SR-04: 5 invalid codes destroy the enrollment session', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('enroll5@m3test.aegis');

      await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send();

      for (let i = 0; i < 4; i++) {
        const r = await request(server)
          .post('/api/v1/auth/totp/enroll/verify')
          .set('Cookie', cookieHeader)
          .set('X-CSRF-Token', csrfToken)
          .send({ code: '000000' });
        expect(r.status).toBe(401);
        expect(r.body.error.code).toBe('INVALID_CODE');
      }

      // 5th attempt destroys the session
      const last = await request(server)
        .post('/api/v1/auth/totp/enroll/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: '000000' });
      expect(last.status).toBe(401);
      expect(last.body.error.code).toBe('TOO_MANY_ATTEMPTS');

      const sidOnly = cookieHeader.split(';')[0];
      const check = await request(server).get('/api/v1/auth/session').set('Cookie', sidOnly);
      expect(check.body.state).toBe('ANONYMOUS');
    });
  });

  // ── MFA verify tests ─────────────────────────────────────────────────────────

  describe('MFA verify', () => {
    it('mfa/verify: valid code → ACTIVE session', async () => {
      const { auth, secret } = await enrollTotp('mfa1@m3test.aegis');
      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'mfa1@m3test.aegis');

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: totpCode(secret, 1) });

      expect(mfaRes.status).toBe(200);
      expect(mfaRes.body.state).toBe('ACTIVE');
      expect(mfaRes.body.user.totpEnrolled).toBe(true);
    });

    it('SR-04: TOTP replay rejected in mfa/verify', async () => {
      const { auth, secret } = await enrollTotp('mfa2@m3test.aegis');

      // Get the lastTotpStep that was set during enrollment
      const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mfa2@m3test.aegis' } });
      const lastStep = user.lastTotpStep!;

      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'mfa2@m3test.aegis');
      const replayCode = generateSync({
        secret,
        strategy: 'hotp',
        counter: Number(lastStep),
      });

      const res = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: replayCode });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CODE');
    });

    it('SR-05: MFA session token invalidated after mfa/verify', async () => {
      const { auth, secret } = await enrollTotp('mfa3@m3test.aegis');
      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'mfa3@m3test.aegis');

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: totpCode(secret, 1) });
      expect(mfaRes.status).toBe(200);

      // Old MFA session must be invalid
      const sidOnly = cookieHeader.split(';')[0];
      const replayRes = await request(server).get('/api/v1/auth/session').set('Cookie', sidOnly);
      expect(replayRes.body.state).toBe('ANONYMOUS');
    });

    it('SR-04: 5 failures per session destroy the MFA session', async () => {
      const { auth } = await enrollTotp('mfa4@m3test.aegis');
      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'mfa4@m3test.aegis');

      for (let i = 0; i < 4; i++) {
        const r = await request(server)
          .post('/api/v1/auth/mfa/verify')
          .set('Cookie', cookieHeader)
          .set('X-CSRF-Token', csrfToken)
          .send({ code: '000000' });
        expect(r.status).toBe(401);
        expect(r.body.error.code).toBe('INVALID_CODE');
      }

      const last = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: '000000' });
      expect(last.status).toBe(401);
      expect(last.body.error.code).toBe('TOO_MANY_ATTEMPTS');

      const sidOnly = cookieHeader.split(';')[0];
      const check = await request(server).get('/api/v1/auth/session').set('Cookie', sidOnly);
      expect(check.body.state).toBe('ANONYMOUS');
    });

    it('SR-04: 10 failures/hour lock the account (seed count=9, then fail once more)', async () => {
      const email = 'mfa5@m3test.aegis';
      const { auth } = await enrollTotp(email);

      // Seed 9 failures to simulate previous sessions
      await prisma.user.updateMany({
        where: { email },
        data: { mfaFailedCount: 9, mfaWindowStart: new Date() },
      });

      const { cookieHeader, csrfToken } = await loginPasskey(auth, email);
      const res = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken)
        .send({ code: '000000' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');

      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.status).toBe('LOCKED');
    });
  });

  // ── Step-up tests ────────────────────────────────────────────────────────────

  describe('Step-up', () => {
    it('step-up: valid code sets stepUpAt on new session', async () => {
      const { auth, secret } = await enrollTotp('stepup1@m3test.aegis');
      const { cookieHeader: mfaCookie, csrfToken: mfaCsrf } = await loginPasskey(
        auth,
        'stepup1@m3test.aegis',
      );

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', mfaCookie)
        .set('X-CSRF-Token', mfaCsrf)
        .send({ code: totpCode(secret, 1) });
      expect(mfaRes.status).toBe(200);

      const { cookieHeader: activeCookie, csrfToken: activeCsrf } = parseCookies(
        mfaRes.headers['set-cookie'],
      );

      const stepRes = await request(server)
        .post('/api/v1/auth/step-up')
        .set('Cookie', activeCookie)
        .set('X-CSRF-Token', activeCsrf)
        .send({ code: totpCode(secret, 2) });

      expect(stepRes.status).toBe(200);
      expect(stepRes.body.stepUpValidUntil).toBeDefined();
    });

    it('SR-05: step-up session token invalidated after rotation', async () => {
      const { auth, secret } = await enrollTotp('stepup2@m3test.aegis');
      const { cookieHeader: mfaCookie, csrfToken: mfaCsrf } = await loginPasskey(
        auth,
        'stepup2@m3test.aegis',
      );

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', mfaCookie)
        .set('X-CSRF-Token', mfaCsrf)
        .send({ code: totpCode(secret, 1) });

      const { cookieHeader: activeCookie, csrfToken: activeCsrf } = parseCookies(
        mfaRes.headers['set-cookie'],
      );

      await request(server)
        .post('/api/v1/auth/step-up')
        .set('Cookie', activeCookie)
        .set('X-CSRF-Token', activeCsrf)
        .send({ code: totpCode(secret, 2) });

      // Old active session must be gone
      const sidOnly = activeCookie.split(';')[0];
      const check = await request(server).get('/api/v1/auth/session').set('Cookie', sidOnly);
      expect(check.body.state).toBe('ANONYMOUS');
    });

    it('step-up: invalid code returns 401', async () => {
      const { auth, secret } = await enrollTotp('stepup3@m3test.aegis');
      const { cookieHeader: mfaCookie, csrfToken: mfaCsrf } = await loginPasskey(
        auth,
        'stepup3@m3test.aegis',
      );

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', mfaCookie)
        .set('X-CSRF-Token', mfaCsrf)
        .send({ code: totpCode(secret, 1) });

      const { cookieHeader: activeCookie, csrfToken: activeCsrf } = parseCookies(
        mfaRes.headers['set-cookie'],
      );

      const res = await request(server)
        .post('/api/v1/auth/step-up')
        .set('Cookie', activeCookie)
        .set('X-CSRF-Token', activeCsrf)
        .send({ code: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CODE');
    });
  });

  // ── SR-02: Pending session blocking ─────────────────────────────────────────

  describe('SR-02: Pending sessions rejected on normal routes', () => {
    it('MFA_PENDING session → 401 MFA_REQUIRED on active-only route', async () => {
      const { auth } = await enrollTotp('sr02a@m3test.aegis');
      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'sr02a@m3test.aegis');

      // logout is an ACTIVE-only route — MFA_PENDING must return MFA_REQUIRED
      const res = await request(server)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('MFA_REQUIRED');
    });

    it('ENROLLMENT_PENDING session → 401 ENROLLMENT_REQUIRED on normal route', async () => {
      const { cookieHeader, csrfToken } = await registerPasskey('sr02b@m3test.aegis');

      const res = await request(server)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('ACTIVE session → 401 on totp/enroll (requires ENROLLMENT_PENDING)', async () => {
      const { auth, secret } = await enrollTotp('sr02c@m3test.aegis');
      const { cookieHeader: mfaCookie, csrfToken: mfaCsrf } = await loginPasskey(
        auth,
        'sr02c@m3test.aegis',
      );

      const mfaRes = await request(server)
        .post('/api/v1/auth/mfa/verify')
        .set('Cookie', mfaCookie)
        .set('X-CSRF-Token', mfaCsrf)
        .send({ code: totpCode(secret, 1) });

      const { cookieHeader: activeCookie, csrfToken: activeCsrf } = parseCookies(
        mfaRes.headers['set-cookie'],
      );

      const res = await request(server)
        .post('/api/v1/auth/totp/enroll')
        .set('Cookie', activeCookie)
        .set('X-CSRF-Token', activeCsrf)
        .send();

      expect(res.status).toBe(401);
    });
  });

  // ── SR-18: TOTP code never logged ────────────────────────────────────────────

  describe('SR-18: TOTP code not in log output', () => {
    it('no console method outputs the TOTP code during mfa/verify', async () => {
      const { auth, secret } = await enrollTotp('sr18@m3test.aegis');
      const { cookieHeader, csrfToken } = await loginPasskey(auth, 'sr18@m3test.aegis');
      const code = totpCode(secret, 1);

      const logged: string[] = [];
      const spy = jest
        .spyOn(console, 'log')
        .mockImplementation((...args: unknown[]) => logged.push(args.join(' ')));
      const warnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation((...args: unknown[]) => logged.push(args.join(' ')));
      const errSpy = jest
        .spyOn(console, 'error')
        .mockImplementation((...args: unknown[]) => logged.push(args.join(' ')));

      try {
        await request(server)
          .post('/api/v1/auth/mfa/verify')
          .set('Cookie', cookieHeader)
          .set('X-CSRF-Token', csrfToken)
          .send({ code });
      } finally {
        spy.mockRestore();
        warnSpy.mockRestore();
        errSpy.mockRestore();
      }

      const allOutput = logged.join('\n');
      expect(allOutput).not.toContain(code);
    });
  });
});
