import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './guards/session.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { RolesGuard } from './guards/roles.guard';
import { StepUpGuard } from './guards/step-up.guard';
import { ChallengeService } from './challenge.service';
import { WebAuthnService } from './webauthn.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';
import { AuthController } from './auth.controller';
import { AuditModule } from '../audit/audit.module';
import { CryptoModule } from '../crypto/crypto.module';

// Guards registered globally; order: session → csrf → roles → step-up.
@Global()
@Module({
  imports: [AuditModule, CryptoModule],
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: StepUpGuard },
    ChallengeService,
    WebAuthnService,
    SessionService,
    TotpService,
  ],
  exports: [ChallengeService, WebAuthnService, SessionService],
})
export class AuthModule {}
