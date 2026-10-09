import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
// Accept a client-supplied id only if it is short and log-safe; otherwise generate one.
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
