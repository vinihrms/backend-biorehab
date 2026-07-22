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
import ParticipacaoEstudoController from './modules/participacao_estudo/controllers/ParticipacaoEstudoController';
import TiposVisitaController from './modules/tipos_visita/controllers/TiposVisitaController';
import VisitaController from './modules/visitas/controllers/VisitaController';

const routes = Router();
// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

routes.post('/api/auth/cadastro', asyncHandler(authController.cadastrar));
routes.post('/api/auth/login', asyncHandler(authController.login));

routes.get(
  '/api/auth/me',
  autenticacaoMiddleware,
  (req: RequestAutenticado, res: Response) => {
    return sendSuccess(
      res,
      {
        data: req.usuarioLogado ?? null,
        message: 'Voce acessou uma rota protegida com sucesso!'
      },
      HttpStatus.OK
    );
  }
);

// ============================================================================
// ESTUDOS
// ============================================================================

routes.get('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.listar));
routes.get('/api/estudos/excluidos', autenticacaoMiddleware, asyncHandler(estudoController.listarExcluidos));
routes.get('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.buscarPorId));

routes.post('/api/estudos', autenticacaoMiddleware, asyncHandler(estudoController.criar));

routes.patch('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.atualizar));

routes.delete('/api/estudos/:estudoId', autenticacaoMiddleware, asyncHandler(estudoController.deletar));

routes.patch('/api/estudos/:estudoId/restaurar', autenticacaoMiddleware, asyncHandler(estudoController.restaurar));

// ============================================================================
// PERMISSÕES DO ESTUDO
// ============================================================================

routes.get('/api/estudos/:estudoId/permissoes', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.listar));

routes.post('/api/estudos/:estudoId/permissoes', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.criar));

routes.patch('/api/estudos/:estudoId/permissoes/:usuarioId', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.atualizar));

routes.delete('/api/estudos/:estudoId/permissoes/:usuarioId', autenticacaoMiddleware, asyncHandler(PermissaoEstudoController.deletar));

// ============================================================================
// PARTICIPANTES DO ESTUDO
// ============================================================================

routes.get('/api/estudos/:estudoId/participantes', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.listarPorEstudo));
routes.get('/api/estudos/:estudoId/participantes/excluidos', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.listarExcluidos));
routes.get('/api/estudos/:estudoId/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.buscaParticipacao));


routes.post('/api/estudos/:estudoId/participantes', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.vincularAoEstudo));

routes.patch('/api/estudos/:estudoId/participantes/:participanteId/restaurar', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.restaurar));
routes.delete('/api/estudos/:estudoId/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipacaoEstudoController.desvinculaAoEstudo));



// ============================================================================
// VARIÁVEIS
// ============================================================================

routes.get('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.listar));
routes.get('/api/estudos/:estudoId/variaveis/excluidas', autenticacaoMiddleware, asyncHandler(VariavelController.listarExcluidas));
routes.get('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.listarPorId));

routes.post('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.criar));

routes.patch('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.atualizar));

routes.delete('/api/estudos/:estudoId/variaveis/:variavelId', autenticacaoMiddleware, asyncHandler(VariavelController.deletar));

routes.patch('/api/estudos/:estudoId/variaveis/:variavelId/restaurar', autenticacaoMiddleware, asyncHandler(VariavelController.restaurar));

// ============================================================================
// TIPOS DE VISITA
// ============================================================================

routes.get('/api/estudos/:estudoId/tipos-visita', autenticacaoMiddleware, asyncHandler(TiposVisitaController.listarPorEstudo));
routes.get('/api/estudos/:estudoId/tipos-visita/excluidos', autenticacaoMiddleware, asyncHandler(TiposVisitaController.buscaExcluidos));
routes.get('/api/estudos/:estudoId/tipos-visita/:tipoVisitaId', autenticacaoMiddleware, asyncHandler(TiposVisitaController.getVisitaById));

routes.post('/api/estudos/:estudoId/tipos-visita', autenticacaoMiddleware, asyncHandler(TiposVisitaController.criaTipoDeVisita));

routes.patch('/api/estudos/:estudoId/tipos-visita/:tipoVisitaId', autenticacaoMiddleware, asyncHandler(TiposVisitaController.atualiza));

routes.delete('/api/estudos/:estudoId/tipos-visita/:tipoVisitaId', autenticacaoMiddleware, asyncHandler(TiposVisitaController.apagar));

routes.patch('/api/estudos/:estudoId/tipos-visita/:tipoVisitaId/restaurar', autenticacaoMiddleware, asyncHandler(TiposVisitaController.restaura));

// ============================================================================
// PARTICIPANTES
// ============================================================================

routes.get('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.listar));
routes.get('/api/participantes/excluidos', autenticacaoMiddleware, asyncHandler(ParticipanteController.listarExcluidos));
routes.get('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.buscaPorId));

routes.post('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.criar));

routes.patch('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.atualizar));

routes.delete('/api/participantes/:participanteId', autenticacaoMiddleware, asyncHandler(ParticipanteController.deletar));

routes.patch('/api/participantes/:participanteId/restaurar', autenticacaoMiddleware, asyncHandler(ParticipanteController.restaurar));


// ============================================================================
// VISITAS
// ============================================================================

routes.get('/api/participacoes/:participacaoId/visitas', autenticacaoMiddleware, asyncHandler(VisitaController.listar));
routes.get('/api/participacoes/:participacaoId/visitas/excluidas', autenticacaoMiddleware, asyncHandler(VisitaController.listarExcluidas));
routes.get('/api/participacoes/:participacaoId/visitas/:visitaId', autenticacaoMiddleware, asyncHandler(VisitaController.buscarPorId));
routes.post('/api/participacoes/:participacaoId/visitas', autenticacaoMiddleware, asyncHandler(VisitaController.criar));
routes.patch('/api/participacoes/:participacaoId/visitas/:visitaId', autenticacaoMiddleware, asyncHandler(VisitaController.atualizar));
routes.delete('/api/participacoes/:participacaoId/visitas/:visitaId', autenticacaoMiddleware, asyncHandler(VisitaController.deletar));
routes.patch('/api/participacoes/:participacaoId/visitas/:visitaId/restaurar', autenticacaoMiddleware, asyncHandler(VisitaController.restaurar));


// ============================================================================
// MEDIÇÕES
// ============================================================================

/*
GET    /api/visitas/:visitaId/medicoes
GET    /api/visitas/:visitaId/medicoes/:medicaoId
POST   /api/visitas/:visitaId/medicoes
PATCH  /api/visitas/:visitaId/medicoes/:medicaoId
DELETE /api/visitas/:visitaId/medicoes/:medicaoId
PATCH  /api/visitas/:visitaId/medicoes/:medicaoId/restaurar
*/
export default routes;