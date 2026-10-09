import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigError } from '../src/config/env';
import { PrismaService } from '../src/database/prisma.service';
import { StorageProbe } from '../src/health/storage.probe';
import { createApp, testEnv } from './helpers';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('HTTP foundation (stubbed dependencies)', () => {
  let app: INestApplication;
  let db = true;
  let storage = true;

  beforeAll(async () => {
    testEnv();
    app = await createApp((b) =>
      b
        .overrideProvider(PrismaService)
        .useValue({ ping: async () => db })
        .overrideProvider(StorageProbe)
        .useValue({ ping: async () => storage }),
    );
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    db = true;
    storage = true;
  });

  describe('GET /api/v1/health (liveness)', () => {
    it('returns 200 {status: ok} even when dependencies are down', async () => {
      db = false;
      storage = false;
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('does not advertise the framework', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('GET /api/v1/health/ready (readiness)', () => {
    it('returns 200 with db and storage up', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
      expect(res.body).toEqual({ db: 'up', storage: 'up' });
    });

    it('returns 503 and names the failing dependency (db)', async () => {
      db = false;
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
      expect(res.body).toEqual({ db: 'down', storage: 'up' });
    });

    it('returns 503 and names the failing dependency (storage)', async () => {
      storage = false;
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
      expect(res.body).toEqual({ db: 'up', storage: 'down' });
    });
  });

  describe('error format', () => {
    it('returns the contract error shape for unknown routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
      expect(res.body.error).toEqual({
        code: 'NOT_FOUND',
        message: expect.any(String),
        requestId: expect.stringMatching(UUID),
      });
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });

    it('treats routes outside /api/v1 as not found (no unprefixed health route)', async () => {
      await request(app.getHttpServer()).get('/health').expect(404);
    });

    it('returns VALIDATION_FAILED for malformed JSON without echoing parser details', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/nope')
        .set('Content-Type', 'application/json')
        .send('{"broken":')
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(JSON.stringify(res.body)).not.toMatch(/JSON|position|token/i);
      expect(res.body.error.requestId).toBeDefined();
    });
  });

  describe('request ids', () => {
    it('generates a UUID request id on every response', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.headers['x-request-id']).toMatch(UUID);
    });

    it('honours a safe client-supplied request id, including in errors', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nope')
        .set('X-Request-Id', 'frontend-trace-0001')
        .expect(404);
      expect(res.headers['x-request-id']).toBe('frontend-trace-0001');
      expect(res.body.error.requestId).toBe('frontend-trace-0001');
    });

    it('replaces an unsafe client-supplied request id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Request-Id', 'bad id with spaces!');
      expect(res.headers['x-request-id']).toMatch(UUID);
    });
  });
});

describe('Readiness with genuinely unreachable dependencies (real probes)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    testEnv(); // DATABASE_URL and MINIO_ENDPOINT point at 127.0.0.1:1 where nothing listens
    app = await createApp();
  });
  afterAll(async () => app.close());

  it('reports 503 with both dependencies down, and liveness is unaffected', async () => {
    const ready = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
    expect(ready.body).toEqual({ db: 'down', storage: 'down' });
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});

describe('Startup with invalid configuration', () => {
  it('fails to build the app when a required setting is missing', async () => {
    testEnv({ AEGIS_KEK_V1: undefined });
    await expect(createApp()).rejects.toBeInstanceOf(ConfigError);
  });

  it('fails when LEDGER_DRIVER=memory in production (SR-22)', async () => {
    testEnv({ NODE_ENV: 'production', LEDGER_DRIVER: 'memory' });
    await expect(createApp()).rejects.toThrow(/LEDGER_DRIVER/);
  });
});
