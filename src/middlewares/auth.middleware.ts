import type { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../utils/http-status';

export type RequestAutenticado = Request;

type JwtPayload = {
  id: number;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
};

export default function autenticacaoMiddleware(
  req: RequestAutenticado,
  _res: Response,
  next: NextFunction
) {
  const loginHeader = req.headers.authorization;

  if (!loginHeader) {
    return next(new AppError('AUTH_TOKEN_MISSING', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED));
  }

  const partes = loginHeader.split(' ');

  if (partes.length !== 2) {
    return next(new AppError('AUTH_TOKEN_MALFORMED', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED));
  }

  const esquema = partes[0];
  const token = partes[1];

  if (!esquema || !token) {
    return next(new AppError('AUTH_TOKEN_MALFORMED', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED));
  }

  if (!/^Bearer$/i.test(esquema)) {
    return next(new AppError('AUTH_TOKEN_MALFORMED', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED));
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError('CONFIG_ERROR', 'Erro interno do servidor.', HttpStatus.INTERNAL_SERVER_ERROR));
  }

  try {
    const jwtSecret: string = secret;
    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || typeof decoded === 'string') {
      throw new AppError('INVALID_TOKEN', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED);
    }

    const payload = decoded as JwtPayload;

    if (typeof payload.id !== 'number' || typeof payload.isAdmin !== 'boolean') {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired token.', HttpStatus.UNAUTHORIZED);
    }

    req.usuarioLogado = {
      id: payload.id,
      isAdmin: payload.isAdmin
    };

    return next();
  } catch (err) {
    return next(new AppError('INVALID_TOKEN', 'Não foi possível autenticar a solicitação.', HttpStatus.UNAUTHORIZED));
  }
}