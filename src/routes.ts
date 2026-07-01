import { Router } from 'express';
import type { Response } from 'express';
import autenticacaoMiddleware, { RequestAutenticado } from './middlewares/auth.middleware';
import authController from './modules/auth/controllers/AuthController';
import asyncHandler from './utils/async-handler';
import { HttpStatus } from './utils/http-status';
import { sendSuccess } from './utils/response';
import estudoController from './modules/estudos/controllers/EstudoController';
import ParticipanteController from './modules/participantes/controllers/ParticipanteController';

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
routes.get('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.list))
routes.get('/api/estudos/excluidos', autenticacaoMiddleware, asyncHandler(estudoController.listarExcluidos))
routes.get('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.buscarPorId))
routes.post('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.criar))
routes.patch('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.atualizar))
routes.patch('/api/estudos/:estudoId/restaurar', autenticacaoMiddleware, asyncHandler(estudoController.restaurar))
routes.delete('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.deletar))

// ROTAS PARTICIPANTES
routes.get('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.listar))
routes.get('/api/participantes/excluidos', autenticacaoMiddleware, asyncHandler(ParticipanteController.listarExcluidos))
routes.get('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.buscaPorId))
routes.post('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.criar))
routes.patch('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.atualizar))
routes.patch('/api/participantes/:participanteId/restaurar', autenticacaoMiddleware, asyncHandler(ParticipanteController.restaurar))
routes.delete('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.deletar))


export default routes;