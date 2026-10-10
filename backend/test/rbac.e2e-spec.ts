import { Controller, Get, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { StorageProbe } from '../src/health/storage.probe';
import { testEnv } from './helpers';

/** A controller whose single route is NOT marked @Public — the guards must protect it. */
@Controller('_test')
class ProtectedController {
  @Get()
  secret() {
    return { secret: true };
  }

  @Post()
  create() {
    return { created: true };
  }
}

@Module({ controllers: [ProtectedController] })
class TestModule {}

async function createRbacApp(prismaOverride?: {
  ping?: () => Promise<boolean>;
  session?: { findUnique: jest.Mock };
}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule, TestModule] })
    .overrideProvider(PrismaService)
    .useValue(
      prismaOverride ?? {
        ping: async () => true,
        session: { findUnique: jest.fn().mockResolvedValue(null) },
      },
    )
    .overrideProvider(StorageProbe)
    .useValue({ ping: async () => true });

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

// SR-01: every non-@Public route returns 401 without a session.
describe('SR-01: session guard — deny-by-default', () => {
  let app: INestApplication;

  beforeAll(async () => {
    testEnv();
    app = await createRbacApp();
  });
  afterAll(() => app.close());

  it('GET /api/v1/_test returns 401 without a cookie', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/_test').expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('POST /api/v1/_test returns 401 without a cookie (session check before CSRF)', async () => {
    await request(app.getHttpServer()).post('/api/v1/_test').expect(401);
  });

  it('health endpoints remain accessible without a session (@Public)', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
  });
});

// SR-06: mutating requests with a valid session but no CSRF header return 403.
describe('SR-06: CSRF guard on authenticated mutations', () => {
  let app: INestApplication;

  beforeAll(async () => {
    testEnv();
    // Stub PrismaService so the session guard finds a valid session for the cookie 'valid-token'.
    const fakeSession = {
      id: 'sess-1',
      tokenHash: 'ignored', // SessionGuard looks up by hash; we bypass by stubbing findUnique
      state: 'ACTIVE',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      absoluteAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      user: {
        id: 'user-1',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    };
    app = await createRbacApp({
      ping: async () => true,
      session: {
        findUnique: jest.fn().mockResolvedValue(fakeSession),
        update: jest.fn().mockResolvedValue(fakeSession),
      },
    } as never);
  });
  afterAll(() => app.close());

  it('POST with a session cookie but no X-CSRF-Token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/_test')
      .set('Cookie', 'aegis_sid=any-token')
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST with matching cookie and header passes the CSRF guard', async () => {
    const csrf = 'csrf-token-abc';
    // The route itself returns 404 (no POST handler) but that means CSRF passed.
    const res = await request(app.getHttpServer())
      .post('/api/v1/_test')
      .set('Cookie', `aegis_sid=any-token; aegis_csrf=${csrf}`)
      .set('X-CSRF-Token', csrf);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});
