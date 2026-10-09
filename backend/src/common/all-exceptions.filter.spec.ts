import { ArgumentsHost, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ApiException } from './api-error';
import { AllExceptionsFilter } from './all-exceptions.filter';

function invoke(exception: unknown, requestId: string | undefined = 'req-12345678') {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id: requestId, method: 'GET', path: '/x' }),
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status: res.status.mock.calls[0][0] as number, body: res.json.mock.calls[0][0] };
}

describe('AllExceptionsFilter', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('formats ApiException with its explicit code, details and requestId', () => {
    const { status, body } = invoke(
      new ApiException(409, 'INTEGRITY_FAILURE', 'Hash mismatch', [
        { field: 'sha256', issue: 'bad' },
      ]),
    );
    expect(status).toBe(409);
    expect(body).toEqual({
      error: {
        code: 'INTEGRITY_FAILURE',
        message: 'Hash mismatch',
        details: [{ field: 'sha256', issue: 'bad' }],
        requestId: 'req-12345678',
      },
    });
  });

  it('maps standard HttpExceptions to contract codes', () => {
    expect(invoke(new ForbiddenException('nope')).body.error.code).toBe('FORBIDDEN');
    expect(invoke(new BadRequestException('bad')).body.error.code).toBe('VALIDATION_FAILED');
  });

  it('hides internals for unexpected errors and logs them', () => {
    const { status, body } = invoke(
      new Error('connection to db at 10.0.0.5 failed, password=hunter2'),
    );
    expect(status).toBe(500);
    expect(body.error).toEqual({
      code: 'INTERNAL',
      message: 'Internal server error',
      requestId: 'req-12345678',
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('maps body-parser style client errors without echoing their message', () => {
    const err = Object.assign(new Error('Unexpected token } in JSON at position 5'), {
      status: 400,
    });
    const { status, body } = invoke(err);
    expect(status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.message).toBe('Request could not be processed');
  });

  it('does not echo framework HttpException text (Nest wraps body-parser SyntaxErrors this way)', () => {
    const { status, body } = invoke(
      new BadRequestException('Unexpected token } in JSON at position 5'),
    );
    expect(status).toBe(400);
    expect(body.error.message).toBe('Request could not be processed');
    expect(JSON.stringify(body)).not.toMatch(/JSON|position|token/i);
  });

  it('never returns an internal message for 5xx HttpExceptions', () => {
    const { body } = invoke(new ApiException(503, 'LEDGER_UNAVAILABLE', 'Ledger is down'));
    expect(body.error.code).toBe('LEDGER_UNAVAILABLE');
  });
});
