import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';
import { APP_CONFIG } from './config/config.module';
import { ConfigError, loadConfig, type AppConfig } from './config/env';

async function bootstrap(): Promise<void> {
  // Optional local overrides; real environment variables take precedence. backend/.env is git-ignored.
  if (existsSync('.env')) process.loadEnvFile('.env');

  loadConfig(); // fail fast with a clean message before Nest starts (module re-validates)
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.PORT);
  new Logger('Bootstrap').log(
    `AegisChain API listening on port ${config.PORT} (${config.NODE_ENV})`,
  );
}

bootstrap().catch((err: unknown) => {
  // Fail safely: report which settings are wrong, never their values, then exit non-zero.
  if (err instanceof ConfigError) {
    console.error(err.message);
  } else {
    console.error(
      'Fatal error during startup:',
      err instanceof Error ? err.message : 'unknown error',
    );
  }
  process.exit(1);
});
