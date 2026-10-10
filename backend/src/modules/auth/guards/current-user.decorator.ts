import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../../generated/prisma/client';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  const req = ctx.switchToHttp().getRequest<Request & { user?: User }>();
  return req.user!;
});
