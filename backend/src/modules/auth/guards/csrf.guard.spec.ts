import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

// SR-06: mutating requests without a valid X-CSRF-Token return 403.
describe('CsrfGuard', () => {
  function makeGuardAndContext(opts: {
    isPublic?: boolean;
    method?: string;
    csrf?: string;
    header?: string;
  }): { guard: CsrfGuard; context: ExecutionContext } {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return opts.isPublic ?? false;
      return undefined;
    });
    const guard = new CsrfGuard(reflector);
    const context: ExecutionContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method: opts.method ?? 'POST',
          cookies: opts.csrf ? { aegis_csrf: opts.csrf } : {},
          headers: opts.header ? { 'x-csrf-token': opts.header } : {},
        }),
      }),
    } as unknown as ExecutionContext;
    return { guard, context };
  }

  it('passes through @Public routes without checking CSRF', () => {
    const { guard, context } = makeGuardAndContext({ isPublic: true, method: 'POST' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('passes GET requests without requiring CSRF', () => {
    const { guard, context } = makeGuardAndContext({ method: 'GET' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('passes when cookie and header match', () => {
    const token = 'same-csrf-token';
    const { guard, context } = makeGuardAndContext({ csrf: token, header: token });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws 403 when X-CSRF-Token header is absent', () => {
    const { guard, context } = makeGuardAndContext({ csrf: 'token' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws 403 when aegis_csrf cookie is absent', () => {
    const { guard, context } = makeGuardAndContext({ header: 'token' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws 403 when cookie and header differ', () => {
    const { guard, context } = makeGuardAndContext({ csrf: 'value-a', header: 'value-b' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws 403 on PUT without CSRF', () => {
    const { guard, context } = makeGuardAndContext({ method: 'PUT' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws 403 on DELETE without CSRF', () => {
    const { guard, context } = makeGuardAndContext({ method: 'DELETE' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
