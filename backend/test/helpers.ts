import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';

/** Fake-but-valid env. The KEK is random per run; nothing here is a real credential. */
export function testEnv(overrides: Record<string, string | undefined> = {}): void {
  const base: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test', // port 1: nothing listens
    MINIO_ENDPOINT: 'http://127.0.0.1:1',
    LEDGER_DRIVER: 'memory',
    AEGIS_KEK_V1: randomBytes(32).toString('base64'),
    ...overrides,
  };
  for (const key of ['DATABASE_URL_FILE', 'AEGIS_KEK_V1_FILE']) delete process.env[key];
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

export async function createApp(
  customise?: (b: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (customise) builder = customise(builder);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
