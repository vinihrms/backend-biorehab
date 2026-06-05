import { Router } from 'express';
import type { Response } from 'express';
import autenticacaoMiddleware, { RequestAutenticado } from './middlewares/auth.middleware';
import authController from './modules/auth/controllers/AuthController';
import asyncHandler from './utils/async-handler';
import { HttpStatus } from './utils/http-status';
import { sendSuccess } from './utils/response';
import estudoController from './modules/estudos/controllers/EstudoController';

const routes = Router();

routes.post('/api/auth/cadastro', asyncHandler(authController.cadastrar));
routes.post('/api/auth/login', asyncHandler(authController.login));

routes.get('/api/auth/me', autenticacaoMiddleware, (req: RequestAutenticado, res: Response) => {
  return sendSuccess(
    res,
    {
      data: req.usuarioLogado ?? null,
      message: 'Voce acessou uma rota protegida com sucesso!'
    },
    HttpStatus.OK
  );
});

// ROTAS REFERENTES A ESTUDOS
routes.post('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.criar))

export default routes;