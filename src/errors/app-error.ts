import { HttpStatus, type HttpStatusCode } from '../utils/http-status';

export class AppError extends Error {
  readonly statusCode: HttpStatusCode;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
