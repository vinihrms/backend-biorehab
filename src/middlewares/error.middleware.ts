import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../utils/http-status';
import { sendError } from '../utils/response';

type ValidationIssue = {
  field: string;
  message: string;
};

function formatZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message
  }));
}

export default function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation error.',
        details: formatZodIssues(err)
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  if (err instanceof AppError) {
    return sendError(
      res,
      {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      },
      err.statusCode
    );
  }

  console.error('Unexpected error:', err);
  return sendError(
    res,
    {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.'
    },
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
