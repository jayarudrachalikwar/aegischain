import type { NextFunction, Request, Response } from 'express';
import { requestIdMiddleware } from './request-id';

function run(headerValue?: string) {
  const req = { header: () => headerValue } as unknown as Request;
  const headers: Record<string, string> = {};
  const res = { setHeader: (k: string, v: string) => (headers[k] = v) } as unknown as Response;
  const next = jest.fn() as NextFunction;
  requestIdMiddleware(req, res, next);
  return { req, headers, next };
}

describe('requestIdMiddleware', () => {
  it('generates a UUID when no header is sent and exposes it on request and response', () => {
    const { req, headers, next } = run();
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(headers['X-Request-Id']).toBe(req.id);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('keeps a well-formed client-supplied id', () => {
    const { req, headers } = run('client-trace-1234');
    expect(req.id).toBe('client-trace-1234');
    expect(headers['X-Request-Id']).toBe('client-trace-1234');
  });

  it.each([
    'short',
    'has spaces in it 123',
    'line\r\nbreak-injection',
    'x'.repeat(65),
    '<script>alert(1)</script>',
  ])('replaces an unsafe client-supplied id: %j', (bad) => {
    const { req } = run(bad);
    expect(req.id).not.toBe(bad);
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
