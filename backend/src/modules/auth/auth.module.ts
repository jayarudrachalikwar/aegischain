import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './guards/session.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { RolesGuard } from './guards/roles.guard';
import { ChallengeService } from './challenge.service';
import { WebAuthnService } from './webauthn.service';
import { SessionService } from './session.service';
import { AuthController } from './auth.controller';
import { AuditModule } from '../audit/audit.module';

// Guards registered globally via APP_GUARD; order: session → csrf → roles.
@Global()
@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    ChallengeService,
    WebAuthnService,
    SessionService,
  ],
  exports: [ChallengeService, WebAuthnService, SessionService],
})
export class AuthModule {}
