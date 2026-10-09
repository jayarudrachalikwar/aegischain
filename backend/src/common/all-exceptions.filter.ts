import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from './api-error';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'FILE_TOO_LARGE',
  415: 'UNSUPPORTED_FILE_TYPE',
  429: 'RATE_LIMITED',
};

// Fixed, safe messages. Framework/parser errors can carry internals (e.g. JSON parse positions),
// so their text is never echoed; throw ApiException to return a specific message.
const MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Request could not be processed',
  401: 'Authentication failed',
  403: 'Access denied',
  404: 'Resource not found',
  409: 'Request conflicts with current state',
  413: 'Payload too large',
  415: 'Unsupported media type',
  429: 'Too many requests',
};
const GENERIC_CLIENT_MESSAGE = 'Request could not be processed';

interface StatusError {
  status?: number;
  statusCode?: number;
}

/** Converts every error into `{ error: { code, message, details?, requestId } }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = req.id ?? 'unknown';

    let status = 500;
    let code = 'INTERNAL';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = CODE_BY_STATUS[status] ?? (status < 500 ? 'VALIDATION_FAILED' : 'INTERNAL');
      if (status < 500) message = MESSAGE_BY_STATUS[status] ?? GENERIC_CLIENT_MESSAGE;
    } else if (this.isClientHttpError(exception)) {
      // Errors raised by body-parser etc. (malformed JSON, payload too large).
      status = exception.status ?? exception.statusCode ?? 400;
      code = CODE_BY_STATUS[status] ?? 'VALIDATION_FAILED';
      message = MESSAGE_BY_STATUS[status] ?? GENERIC_CLIENT_MESSAGE;
    }

    if (status >= 500) {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `[${requestId}] ${req.method} ${req.path} -> ${status}: ${err.message}`,
        err.stack,
      );
    }

    res
      .status(status)
      .json({ error: { code, message, ...(details ? { details } : {}), requestId } });
  }

  private isClientHttpError(e: unknown): e is StatusError {
    if (typeof e !== 'object' || e === null) return false;
    const s = (e as StatusError).status ?? (e as StatusError).statusCode;
    return typeof s === 'number' && s >= 400 && s < 500;
  }
}
