import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { Express } from 'express';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { requestIdMiddleware } from './request-id';

export const API_PREFIX = 'api/v1';

/** Shared by main.ts and e2e tests so both exercise the same HTTP pipeline. */
export function configureApp(app: INestApplication): void {
  (app.getHttpAdapter().getInstance() as Express).disable('x-powered-by');
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
