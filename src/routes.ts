import type { Response } from 'express';
import { Router } from 'express';
import autenticacaoMiddleware, { RequestAutenticado } from './middlewares/auth.middleware';
import { uploadPlanilhaMiddleware } from './middlewares/upload.middleware';
import authController from './modules/auth/controllers/AuthController';
import CatalogoController from './modules/catalogo/controllers/CatalogoController';
import CegamentoController from './modules/cegamento/controllers/CegamentoController';
import estudoController from './modules/estudos/controllers/EstudoController';
import ExportController from './modules/export/controllers/ExportController';
import ImportacaoController from './modules/importacao/controllers/ImportacaoController';
import MedicaoController from './modules/medicoes/controllers/MedicaoController';
import ParticipacaoEstudoController from './modules/participacao_estudo/controllers/ParticipacaoEstudoController';
import ParticipanteController from './modules/participantes/controllers/ParticipanteController';
import PermissaoEstudoController from './modules/permissao_estudos/controllers/PermissaoEstudoController';
import RecrutamentoController from './modules/recrutamento/controllers/RecrutamentoController';
import StatusController from './modules/status/controllers/StatusController';
import TiposVisitaController from './modules/tipos_visita/controllers/TiposVisitaController';
import usuarioController from './modules/usuarios/controllers/UsuarioController';
import UsuariosPendentesController from './modules/usuarios_pendendes/UsuariosPendentesController';
import VariavelController from './modules/variaveis/controllers/VariavelController';
import VisitaController from './modules/visitas/controllers/VisitaController';
import asyncHandler from './utils/async-handler';
import { HttpStatus } from './utils/http-status';
import { sendSuccess } from './utils/response';

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
        message: 'Voce acessou uma rota protegida com sucesso!',
      },
      HttpStatus.OK
    );
  }
);

routes.get('/api/ping', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ROTAS PÚBLICAS — RECRUTAMENTO / TRIAGEM DE VOLUNTÁRIOS
// ============================================================================

routes.get('/api/public/recrutamento/:tokenPublico', asyncHandler(RecrutamentoController.obterPublico));
routes.post(
  '/api/public/recrutamento/:tokenPublico/inscricoes',
  asyncHandler(RecrutamentoController.inscreverPublico)
);

// ============================================================================
// USUÁRIOS E PENDENTES
// ============================================================================

routes.get(
  '/api/usuarios/pendentes',
  autenticacaoMiddleware,
  asyncHandler(UsuariosPendentesController.listarTodosPendentes)
);
routes.patch(
  '/api/usuarios/pendentes/:usuarioId/aceitar',
  autenticacaoMiddleware,
  asyncHandler(UsuariosPendentesController.ativar)
);
routes.delete(
  '/api/usuarios/pendentes/:usuarioId/recusar',
  autenticacaoMiddleware,
  asyncHandler(UsuariosPendentesController.recusar)
);
routes.get(
  '/api/usuarios/buscar',
  autenticacaoMiddleware,
  asyncHandler(usuarioController.buscarAtivos)
);
routes.get('/api/usuarios', autenticacaoMiddleware, asyncHandler(usuarioController.listar));
routes.get('/api/usuarios/:usuarioId', autenticacaoMiddleware, asyncHandler(usuarioController.buscarPorId));
routes.patch('/api/usuarios/:usuarioId', autenticacaoMiddleware, asyncHandler(usuarioController.atualizar));
routes.delete('/api/usuarios/:usuarioId', autenticacaoMiddleware, asyncHandler(usuarioController.excluir));

// ============================================================================
// CATÁLOGO OFICIAL (VARIÁVEIS E TIPOS DE VISITA)
// ============================================================================

routes.get('/api/catalogo/variaveis', autenticacaoMiddleware, asyncHandler(CatalogoController.listarVariaveis));
routes.post('/api/catalogo/variaveis', autenticacaoMiddleware, asyncHandler(CatalogoController.criarVariavel));
routes.patch(
  '/api/catalogo/variaveis/:catalogoId',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.atualizarVariavel)
);
routes.delete(
  '/api/catalogo/variaveis/:catalogoId',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.deletarVariavel)
);

routes.get(
  '/api/catalogo/tipos-visita',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.listarTiposVisita)
);
routes.post(
  '/api/catalogo/tipos-visita',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.criarTipoVisita)
);
routes.patch(
  '/api/catalogo/tipos-visita/:catalogoId',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.atualizarTipoVisita)
);
routes.delete(
  '/api/catalogo/tipos-visita/:catalogoId',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.deletarTipoVisita)
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
routes.patch(
  '/api/estudos/:estudoId/permissoes/:usuarioId',
  autenticacaoMiddleware,
  asyncHandler(PermissaoEstudoController.atualizar)
);
routes.delete(
  '/api/estudos/:estudoId/permissoes/:usuarioId',
  autenticacaoMiddleware,
  asyncHandler(PermissaoEstudoController.deletar)
);

// ============================================================================
// PARTICIPANTES DO ESTUDO
// ============================================================================

routes.get(
  '/api/estudos/:estudoId/participantes',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.listarPorEstudo)
);
routes.get(
  '/api/estudos/:estudoId/participantes/excluidos',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.listarExcluidos)
);
routes.get(
  '/api/estudos/:estudoId/participantes/:participanteId',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.buscaParticipacao)
);
routes.post(
  '/api/estudos/:estudoId/participantes',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.vincularAoEstudo)
);
routes.patch(
  '/api/estudos/:estudoId/participantes/:participanteId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.restaurar)
);
routes.delete(
  '/api/estudos/:estudoId/participantes/:participanteId',
  autenticacaoMiddleware,
  asyncHandler(ParticipacaoEstudoController.desvinculaAoEstudo)
);

// ============================================================================
// VARIÁVEIS
// ============================================================================

routes.get('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.listar));
routes.get(
  '/api/estudos/:estudoId/variaveis/excluidas',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.listarExcluidas)
);
routes.patch(
  '/api/estudos/:estudoId/variaveis/reordenar',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.reordenar)
);
routes.post(
  '/api/estudos/:estudoId/variaveis/importar',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.importarVariaveisParaEstudo)
);
routes.get(
  '/api/estudos/:estudoId/variaveis/:variavelId',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.listarPorId)
);
routes.post('/api/estudos/:estudoId/variaveis', autenticacaoMiddleware, asyncHandler(VariavelController.criar));
routes.post(
  '/api/estudos/:estudoId/variaveis/:variavelId/promover-catalogo',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.promoverVariavel)
);
routes.patch(
  '/api/estudos/:estudoId/variaveis/:variavelId',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.atualizar)
);
routes.delete(
  '/api/estudos/:estudoId/variaveis/:variavelId',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.deletar)
);
routes.patch(
  '/api/estudos/:estudoId/variaveis/:variavelId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(VariavelController.restaurar)
);

// ============================================================================
// TIPOS DE VISITA
// ============================================================================

routes.get(
  '/api/estudos/:estudoId/tipos-visita',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.listarPorEstudo)
);
routes.get(
  '/api/estudos/:estudoId/tipos-visita/excluidos',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.buscaExcluidos)
);
routes.patch(
  '/api/estudos/:estudoId/tipos-visita/reordenar',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.reordenar)
);
routes.post(
  '/api/estudos/:estudoId/tipos-visita/importar',
  autenticacaoMiddleware,
  asyncHandler(CatalogoController.importarTiposVisitaParaEstudo)
);
routes.get(
  '/api/estudos/:estudoId/tipos-visita/:tipoVisitaId',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.getVisitaById)
);
routes.post(
  '/api/estudos/:estudoId/tipos-visita',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.criaTipoDeVisita)
);
routes.patch(
  '/api/estudos/:estudoId/tipos-visita/:tipoVisitaId',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.atualiza)
);
routes.delete(
  '/api/estudos/:estudoId/tipos-visita/:tipoVisitaId',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.apagar)
);
routes.patch(
  '/api/estudos/:estudoId/tipos-visita/:tipoVisitaId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(TiposVisitaController.restaura)
);

// ============================================================================
// CEGAMENTO, GRUPOS, ALOCAÇÕES E INTERVENÇÕES
// ============================================================================

routes.get('/api/estudos/:estudoId/grupos', autenticacaoMiddleware, asyncHandler(CegamentoController.listarGrupos));
routes.post('/api/estudos/:estudoId/grupos', autenticacaoMiddleware, asyncHandler(CegamentoController.criarGrupo));
routes.patch(
  '/api/estudos/:estudoId/grupos/:grupoId',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.atualizarGrupo)
);
routes.delete(
  '/api/estudos/:estudoId/grupos/:grupoId',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.deletarGrupo)
);

routes.get(
  '/api/estudos/:estudoId/alocacoes',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.listarAlocacoes)
);
routes.post(
  '/api/estudos/:estudoId/alocacoes',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.alocarParticipante)
);
routes.post(
  '/api/estudos/:estudoId/alocacoes/lote',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.alocarEmLote)
);
routes.post(
  '/api/estudos/:estudoId/alocacoes/:participacaoId/quebrar-cegamento',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.quebraEmergencial)
);
routes.post(
  '/api/estudos/:estudoId/revelar-cegamento',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.revelarCegamento)
);

routes.get(
  '/api/participacoes/:participacaoId/intervencoes',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.listarIntervencoes)
);
routes.post(
  '/api/participacoes/:participacaoId/intervencoes',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.criarIntervencao)
);
routes.patch(
  '/api/participacoes/:participacaoId/intervencoes/:intervencaoId',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.atualizarIntervencao)
);
routes.delete(
  '/api/participacoes/:participacaoId/intervencoes/:intervencaoId',
  autenticacaoMiddleware,
  asyncHandler(CegamentoController.deletarIntervencao)
);

// ============================================================================
// RECRUTAMENTO E CANDIDATOS DO ESTUDO
// ============================================================================

routes.get(
  '/api/estudos/:estudoId/recrutamento',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.obterFormulario)
);
routes.put(
  '/api/estudos/:estudoId/recrutamento',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.salvarFormulario)
);
routes.post(
  '/api/estudos/:estudoId/recrutamento/regenerar-token',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.regenerarToken)
);
routes.get(
  '/api/estudos/:estudoId/candidatos',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.listarCandidatos)
);
routes.patch(
  '/api/estudos/:estudoId/candidatos/:candidatoId',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.atualizarCandidato)
);
routes.post(
  '/api/estudos/:estudoId/candidatos/:candidatoId/converter',
  autenticacaoMiddleware,
  asyncHandler(RecrutamentoController.converterCandidato)
);

// ============================================================================
// IMPORTAÇÃO ASSISTIDA DE PLANILHAS
// ============================================================================

routes.post(
  '/api/estudos/:estudoId/importacao/analisar',
  autenticacaoMiddleware,
  uploadPlanilhaMiddleware,
  asyncHandler(ImportacaoController.analisar)
);
routes.post(
  '/api/estudos/:estudoId/importacao/validar',
  autenticacaoMiddleware,
  asyncHandler(ImportacaoController.validar)
);
routes.post(
  '/api/estudos/:estudoId/importacao/confirmar',
  autenticacaoMiddleware,
  asyncHandler(ImportacaoController.confirmar)
);
routes.get(
  '/api/estudos/:estudoId/importacao/logs',
  autenticacaoMiddleware,
  asyncHandler(ImportacaoController.listarLogs)
);

// ============================================================================
// PARTICIPANTES
// ============================================================================

routes.get('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.listar));
routes.get(
  '/api/participantes/excluidos',
  autenticacaoMiddleware,
  asyncHandler(ParticipanteController.listarExcluidos)
);
routes.get(
  '/api/participantes/:participanteId',
  autenticacaoMiddleware,
  asyncHandler(ParticipanteController.buscaPorId)
);
routes.post('/api/participantes', autenticacaoMiddleware, asyncHandler(ParticipanteController.criar));
routes.patch(
  '/api/participantes/:participanteId',
  autenticacaoMiddleware,
  asyncHandler(ParticipanteController.atualizar)
);
routes.delete(
  '/api/participantes/:participanteId',
  autenticacaoMiddleware,
  asyncHandler(ParticipanteController.deletar)
);
routes.patch(
  '/api/participantes/:participanteId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(ParticipanteController.restaurar)
);

// ============================================================================
// VISITAS
// ============================================================================

routes.get('/api/participacoes/:participacaoId/visitas', autenticacaoMiddleware, asyncHandler(VisitaController.listar));
routes.get(
  '/api/participacoes/:participacaoId/visitas/excluidas',
  autenticacaoMiddleware,
  asyncHandler(VisitaController.listarExcluidas)
);
routes.get(
  '/api/participacoes/:participacaoId/visitas/:visitaId',
  autenticacaoMiddleware,
  asyncHandler(VisitaController.buscarPorId)
);
routes.post('/api/participacoes/:participacaoId/visitas', autenticacaoMiddleware, asyncHandler(VisitaController.criar));
routes.patch(
  '/api/participacoes/:participacaoId/visitas/:visitaId',
  autenticacaoMiddleware,
  asyncHandler(VisitaController.atualizar)
);
routes.delete(
  '/api/participacoes/:participacaoId/visitas/:visitaId',
  autenticacaoMiddleware,
  asyncHandler(VisitaController.deletar)
);
routes.patch(
  '/api/participacoes/:participacaoId/visitas/:visitaId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(VisitaController.restaurar)
);

// ============================================================================
// MEDIÇÕES
// ============================================================================

routes.get('/api/visitas/:visitaId/medicoes', autenticacaoMiddleware, asyncHandler(MedicaoController.listar));
routes.get(
  '/api/visitas/:visitaId/medicoes/excluidas',
  autenticacaoMiddleware,
  asyncHandler(MedicaoController.listarExcluidas)
);
routes.get(
  '/api/visitas/:visitaId/medicoes/:medicaoId',
  autenticacaoMiddleware,
  asyncHandler(MedicaoController.buscarPorId)
);
routes.post('/api/visitas/:visitaId/medicoes', autenticacaoMiddleware, asyncHandler(MedicaoController.criar));
routes.patch(
  '/api/visitas/:visitaId/medicoes/:medicaoId',
  autenticacaoMiddleware,
  asyncHandler(MedicaoController.atualizar)
);
routes.delete(
  '/api/visitas/:visitaId/medicoes/:medicaoId',
  autenticacaoMiddleware,
  asyncHandler(MedicaoController.deletar)
);
routes.patch(
  '/api/visitas/:visitaId/medicoes/:medicaoId/restaurar',
  autenticacaoMiddleware,
  asyncHandler(MedicaoController.restaurar)
);

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

routes.post(
  '/api/estudos/:estudoId/exportar',
  autenticacaoMiddleware,
  asyncHandler(ExportController.exportar)
);

// ============================================================================
// STATUS ESTUDO
// ============================================================================

routes.patch(
  '/api/estudos/:estudoId/status',
  autenticacaoMiddleware,
  asyncHandler(StatusController.atualizarStatus)
);

export default routes;
