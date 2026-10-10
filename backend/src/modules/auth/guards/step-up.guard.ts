import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_STEP_UP_KEY } from './require-step-up.decorator';
import { ApiException } from '../../../common/api-error';
import type { SessionRequest } from './session.guard';

const STEP_UP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest<Partial<SessionRequest>>();
    const session = req.session;
    if (!session?.stepUpAt || Date.now() - session.stepUpAt.getTime() > STEP_UP_TTL_MS) {
      throw new ApiException(403, 'STEP_UP_REQUIRED', 'Step-up authentication required');
    }
    return true;
  }
}
