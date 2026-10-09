import { HttpException } from '@nestjs/common';

export interface ErrorDetail {
  field?: string;
  issue: string;
}

/** Throw to return a contract error with an explicit code (see docs/API_CONTRACT.md). */
export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message, status);
  }
}
