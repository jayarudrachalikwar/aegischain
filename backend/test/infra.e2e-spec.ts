import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, testEnv } from './helpers';

/**
 * Runs against the real PostgreSQL + MinIO from infra/docker-compose.yml.
 * Opt-in: E2E_REAL_INFRA=1 npm run test:e2e   (needs `docker compose up -d` and gen-secrets first)
 */
const enabled = process.env.E2E_REAL_INFRA === '1';
const secret = (name: string) =>
  readFileSync(resolve(__dirname, '../../infra/secrets', name), 'utf8').trim();

(enabled ? describe : describe.skip)('Readiness against real infrastructure', () => {
  let app: INestApplication;

  beforeAll(async () => {
    expect(existsSync(resolve(__dirname, '../../infra/secrets/database_url'))).toBe(true);
    testEnv({
      DATABASE_URL: secret('database_url'),
      MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    });
    app = await createApp();
  });
  afterAll(async () => app?.close());

  it('GET /api/v1/health/ready reports db and storage up', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(res.body).toEqual({ db: 'up', storage: 'up' });
  });
});
