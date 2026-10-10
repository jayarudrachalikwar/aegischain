import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!MUTATING.has(req.method)) return true;

    const cookie = (req.cookies as Record<string, string> | undefined)?.['aegis_csrf'];
    const header = req.headers['x-csrf-token'];

    if (!cookie || !header || typeof header !== 'string') throw new ForbiddenException();

    const buf1 = Buffer.from(cookie);
    const buf2 = Buffer.from(header);
    if (buf1.length !== buf2.length || !timingSafeEqual(buf1, buf2)) {
      throw new ForbiddenException();
    }

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
