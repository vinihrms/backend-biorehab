import type { Response } from 'express';
import { HttpStatus, type HttpStatusCode } from './http-status';

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccessPayload<T> = {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export function sendSuccess<T>(
  res: Response,
  payload: ApiSuccessPayload<T>,
  status: HttpStatusCode = HttpStatus.OK
): Response {
  const body = {
    success: true,
    data: payload.data,
    ...(payload.message ? { message: payload.message } : {}),
    ...(payload.meta ? { meta: payload.meta } : {})
  };

  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  payload: ApiErrorPayload,
  status: HttpStatusCode
): Response {
  return res.status(status).json({
    success: false,
    error: payload
  });
}
