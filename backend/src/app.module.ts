import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    // Auth endpoints: 10 req/min per IP (SR-23). skipIf bypasses throttling in test runs.
    ThrottlerModule.forRoot([{
      name: 'auth',
      ttl: 60_000,
      limit: 10,
      skipIf: () => process.env['NODE_ENV'] === 'test',
    }]),
    AuthModule,
    AuditModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
