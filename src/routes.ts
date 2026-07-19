import { Router } from 'express';
import type { Response } from 'express';
import autenticacaoMiddleware, { RequestAutenticado } from './middlewares/auth.middleware';
import authController from './modules/auth/controllers/AuthController';
import asyncHandler from './utils/async-handler';
import { HttpStatus } from './utils/http-status';
import { sendSuccess } from './utils/response';
import estudoController from './modules/estudos/controllers/EstudoController';
import PermissaoEstudoController from './modules/permissao_estudos/controllers/PermissaoEstudoController';
import ParticipanteController from './modules/participantes/controllers/ParticipanteController';
import VariavelController from './modules/variaveis/controllers/VariavelController';

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
routes.get('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.listar))
routes.get('/api/estudos/excluidos', autenticacaoMiddleware, asyncHandler(estudoController.listarExcluidos))
routes.get('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.buscarPorId))
routes.post('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.criar))
routes.patch('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.atualizar))
routes.delete('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.deletar))
routes.patch('/api/estudos/:estudoId/restaurar', autenticacaoMiddleware, asyncHandler(estudoController.restaurar))

// PERMISSOES POR ESTUDO
routes.get('/api/estudos/:estudoId/permissoes', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.listar))
routes.post('/api/estudos/:estudoId/permissoes', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.criar))
routes.patch('/api/estudos/:estudoId/permissoes/:usuarioId', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.atualizar))
routes.delete('/api/estudos/:estudoId/permissoes/:usuarioId', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.deletar))

// VARIAVEIS
routes.get('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.listar))
routes.get('/api/estudos/:estudoId/variaveis/excluidas', autenticacaoMiddleware, asyncHandler(VariavelController.listarExcluidas))
routes.get('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.listarPorId))
routes.post('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.criar))
routes.patch('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.atualizar))
routes.delete('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.deletar))
routes.patch('/api/estudos/:estudoId/variaveis/:variavelId/restaurar', autenticacaoMiddleware, asyncHandler(VariavelController.restaurar))

// ROTAS PARTICIPANTES
routes.get('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.listar))
routes.get('/api/participantes/excluidos', autenticacaoMiddleware, asyncHandler(ParticipanteController.listarExcluidos))
routes.get('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.buscaPorId))
routes.post('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.criar))
routes.patch('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.atualizar))
routes.patch('/api/participantes/:participanteId/restaurar', autenticacaoMiddleware, asyncHandler(ParticipanteController.restaurar))
routes.delete('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.deletar))



export default routes;