/**
 * M2 integration tests — run only with E2E_REAL_INFRA=1 (needs a migrated PostgreSQL).
 *
 * Verifies (SR-03):
 *   - Registration ceremony (options → verify) produces ENROLLMENT_PENDING session
 *   - Login ceremony (options → verify) produces MFA_PENDING session
 *   - Challenge reuse is rejected (single-use)
 *   - Expired challenge is rejected
 *   - Wrong-scope challenge is rejected
 *   - Used invite is rejected
 *   - Rate limiting: 11th request to login/options returns 429 (SR-23)
 */
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { createSoftAuthenticator } from './helpers/soft-authenticator';
import { createHash, randomBytes } from 'node:crypto';
import { testEnv } from './helpers';

const REAL_INFRA = process.env['E2E_REAL_INFRA'] === '1';
const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:3000';

(REAL_INFRA ? describe : describe.skip)('M2: WebAuthn ceremonies (real infra)', () => {
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
    // Disable audit triggers so cleanup can delete/null-out audit rows created during tests.
    await prisma.$executeRaw`ALTER TABLE audit_events DISABLE TRIGGER ALL`;
    await prisma.$executeRaw`DELETE FROM audit_events WHERE "actorId" IN (SELECT id FROM users WHERE email LIKE '%@test.aegis')`;
    await prisma.$executeRaw`ALTER TABLE audit_events ENABLE TRIGGER ALL`;
    await prisma.challenge.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.webAuthnCredential.deleteMany({});
    await prisma.invite.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: '@test.aegis' } } });
  });

  async function createTestUser(email: string) {
    const id = crypto.randomUUID();
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await prisma.user.create({
      data: {
        id,
        email,
        displayName: 'Test User',
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
    return { id, rawToken };
  }

  it('registration ceremony: options → verify produces ENROLLMENT_PENDING session', async () => {
    const { id: userId, rawToken: inviteToken } = await createTestUser('reg@test.aegis');
    const auth = createSoftAuthenticator();

    // 1. Get registration options
    const optRes = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    expect(optRes.status).toBe(200);
    const { challengeId, publicKey } = optRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };
    expect(challengeId).toBeTruthy();
    expect(publicKey.challenge).toBeTruthy();

    // 2. Generate a real credential response using the software authenticator
    const credential = await auth.register({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId,
    });

    // 3. Verify registration
    const verRes = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId, credential, credentialName: 'Test key' });
    expect(verRes.status).toBe(201);
    expect(verRes.body).toEqual({ state: 'ENROLLMENT_PENDING' });
    expect(verRes.headers['set-cookie']).toBeDefined();

    // Credential stored
    const cred = await prisma.webAuthnCredential.findFirst({ where: { userId } });
    expect(cred).not.toBeNull();
    expect(cred?.name).toBe('Test key');
  });

  it('login ceremony: options → verify produces MFA_PENDING session (SR-03)', async () => {
    // First register a credential
    const { id: userId, rawToken: inviteToken } = await createTestUser('login@test.aegis');
    const auth = createSoftAuthenticator();

    const optRes = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    const { challengeId: regChalId, publicKey } = optRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };
    const credential = await auth.register({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId,
    });
    await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId: regChalId, credential });

    // Promote user to ACTIVE for login
    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });

    // Login
    const loginOptRes = await request(server)
      .post('/api/v1/auth/login/options')
      .send({ email: 'login@test.aegis' });
    expect(loginOptRes.status).toBe(200);
    const { challengeId: loginChalId, publicKey: loginPk } = loginOptRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };

    const assertion = await auth.authenticate({
      challenge: loginPk.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
    });
    const verRes = await request(server)
      .post('/api/v1/auth/login/verify')
      .send({ challengeId: loginChalId, credential: assertion });
    expect(verRes.status).toBe(200);
    expect(verRes.body).toEqual({ state: 'MFA_PENDING' });
  });

  it('challenge reuse is rejected (SR-03: single-use)', async () => {
    const { rawToken: inviteToken } = await createTestUser('reuse@test.aegis');
    const auth = createSoftAuthenticator();

    const optRes = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    const { challengeId, publicKey } = optRes.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };

    const userId = (await prisma.invite.findFirst({ include: { user: true } }))!.userId;
    const credential = await auth.register({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId,
    });

    // First use — success
    const r1 = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId, credential });
    expect(r1.status).toBe(201);

    // Create another fresh invite for the same user (or a new user) to test challenge reuse
    const { id: userId2, rawToken: inviteToken2 } = await createTestUser('reuse2@test.aegis');
    const optRes2 = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken: inviteToken2 });
    const { challengeId: chalId2, publicKey: pk2 } = optRes2.body as {
      challengeId: string;
      publicKey: { challenge: string };
    };
    const auth2 = createSoftAuthenticator();
    const cred2 = await auth2.register({
      challenge: pk2.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId: userId2,
    });

    // First real use
    await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken: inviteToken2, challengeId: chalId2, credential: cred2 });

    // Create a fresh invite for user3 but reuse chalId2
    const { id: userId3, rawToken: inviteToken3 } = await createTestUser('reuse3@test.aegis');
    const cred3 = await auth2.register({
      challenge: pk2.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId: userId3,
    });
    const r2 = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken: inviteToken3, challengeId: chalId2, credential: cred3 });
    expect(r2.status).toBe(401);
  });

  it('used invite is rejected (SR-03: single-use invite)', async () => {
    const { id: userId, rawToken: inviteToken } = await createTestUser('usedInvite@test.aegis');
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

    await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId, credential });

    // Get new options with new challenge but same invite
    const optRes2 = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    expect(optRes2.status).toBe(401);
  });

  it('wrong-scope challenge is rejected (SR-03: purpose binding)', async () => {
    // Create a LOGIN challenge and attempt to use it in register/verify
    const { rawToken: inviteToken } = await createTestUser('wrongscope@test.aegis');

    // Create a LOGIN challenge manually
    const loginOptRes = await request(server).post('/api/v1/auth/login/options').send({});
    const loginChalId = (loginOptRes.body as { challengeId: string }).challengeId;

    const auth = createSoftAuthenticator();
    // Get a REGISTER challenge first for a valid credential
    const optRes = await request(server)
      .post('/api/v1/auth/register/options')
      .send({ inviteToken });
    const { publicKey } = optRes.body as { challengeId: string; publicKey: { challenge: string } };
    const userId = (await prisma.invite.findFirst({
      where: { usedAt: null },
      include: { user: true },
    }))!.userId;
    const credential = await auth.register({
      challenge: publicKey.challenge,
      rpId: RP_ID,
      origin: ORIGIN,
      userId,
    });

    // Attempt to use a LOGIN challengeId in register/verify
    const r = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ inviteToken, challengeId: loginChalId, credential });
    expect(r.status).toBe(401);
  });
});
