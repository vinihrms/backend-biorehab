import { Router } from 'express';
import type { Response } from 'express';
import autenticacaoMiddleware, { RequestAutenticado } from './middlewares/auth.middleware';
import usuarioController from './modules/usuarios/controllers/UsuarioController';
import asyncHandler from './utils/async-handler';
import { HttpStatus } from './utils/http-status';
import { sendSuccess } from './utils/response';

const routes = Router();

routes.post('/usuarios', asyncHandler(usuarioController.cadastrar));
routes.post('/login', asyncHandler(usuarioController.login));

routes.get('/admin', autenticacaoMiddleware, (req: RequestAutenticado, res: Response) => {
  return sendSuccess(
    res,
    {
      data: req.usuarioLogado ?? null,
      message: 'Voce acessou uma rota protegida com sucesso!'
    },
    HttpStatus.OK
  );
});

export default routes;