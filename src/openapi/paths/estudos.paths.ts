import {
  createOperation,
  intPathParam,
  jsonBody,
  type OpenApiPaths,
} from '../openapi.helper';
import { atualizarEstudoSchema, criarEstudoSchema } from '../../modules/estudos/schemas/estudo.schema';
import { criarParticipacaoEstudo } from '../../modules/participacao_estudo/schemas/participacao_estudo.schema';
import {
  atualizarPermissaoEstudoSchema,
  criarPermissaoEstudoSchema,
} from '../../modules/permissao_estudos/schemas/permissao_estudo.schema';
import { alterarStatusSchema } from '../../modules/status/schemas/status.schema';

const estudoIdParam = intPathParam('estudoId', 'ID do estudo');

export const estudosPaths: OpenApiPaths = {
  '/api/estudos': {
    get: createOperation({
      tag: 'Estudos',
      summary: 'Listar estudos acessíveis ao usuário',
      description:
        'Retorna os estudos vinculados ao usuário (ou todos se `isAdmin`) incluindo `meuPapel` e `resumo` (`participacoesAtivas`, `visitasAtivas`, `candidatosPendentes`, `ultimaVisitaEm`).',
    }),
    post: createOperation({
      tag: 'Estudos',
      summary: 'Criar novo estudo',
      description: 'Requer `isAdmin` ou `canCreateStudy = true`. O criador recebe papel `owner`.',
      requestBody: jsonBody(criarEstudoSchema),
      successStatus: '201',
      errors: [403, 409],
    }),
  },

  '/api/estudos/excluidos': {
    get: createOperation({
      tag: 'Estudos',
      summary: 'Listar estudos na lixeira (soft delete)',
      errors: [403],
    }),
  },

  '/api/estudos/{estudoId}': {
    get: createOperation({
      tag: 'Estudos',
      summary: 'Buscar estudo por ID',
      description: 'Inclui `meuPapel` para orientar permissões no frontend.',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Estudos',
      summary: 'Atualizar metadados do estudo',
      description: 'Permitido para `isAdmin`, `owner` ou `study_admin`.',
      parameters: [estudoIdParam],
      requestBody: jsonBody(atualizarEstudoSchema),
      errors: [400, 403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Estudos',
      summary: 'Mover estudo para a lixeira (soft delete)',
      description: 'Permitido para `isAdmin` ou `owner`.',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/restaurar': {
    patch: createOperation({
      tag: 'Estudos',
      summary: 'Restaurar estudo excluído',
      parameters: [estudoIdParam],
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/status': {
    patch: createOperation({
      tag: 'Estudos',
      summary: 'Alterar status do ciclo de vida do estudo',
      description:
        'Transiciona entre `PLANEJAMENTO`, `EM_ANDAMENTO`, `COLETA_ENCERRADA` e `ARQUIVADO` conforme regras de validação.',
      parameters: [estudoIdParam],
      requestBody: jsonBody(alterarStatusSchema),
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/permissoes': {
    get: createOperation({
      tag: 'Permissões do Estudo',
      summary: 'Listar permissões da equipe do estudo',
      description: 'Restrito a `isAdmin`, `owner` ou `study_admin`.',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Permissões do Estudo',
      summary: 'Conceder acesso a um usuário no estudo',
      description: 'Restrito a `isAdmin`, `owner` ou `study_admin`.',
      parameters: [estudoIdParam],
      requestBody: jsonBody(criarPermissaoEstudoSchema),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/permissoes/{usuarioId}': {
    patch: createOperation({
      tag: 'Permissões do Estudo',
      summary: 'Atualizar papel de um membro do estudo',
      parameters: [estudoIdParam, intPathParam('usuarioId', 'ID do usuário membro')],
      requestBody: jsonBody(atualizarPermissaoEstudoSchema),
      errors: [400, 403, 404],
    }),
    delete: createOperation({
      tag: 'Permissões do Estudo',
      summary: 'Revogar acesso de um membro do estudo',
      parameters: [estudoIdParam, intPathParam('usuarioId', 'ID do usuário membro')],
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/participantes': {
    get: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Listar participações vinculadas ao estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Vincular participante global ao estudo',
      description: 'Permitido para `isAdmin`, `owner`, `study_admin`, `collector` e `interventionist`.',
      parameters: [estudoIdParam],
      requestBody: jsonBody(criarParticipacaoEstudo),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/participantes/excluidos': {
    get: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Listar participações excluídas do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/participantes/{participanteId}': {
    get: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Consultar participação específica no estudo',
      parameters: [estudoIdParam, intPathParam('participanteId', 'ID do participante')],
      errors: [403, 404],
    }),
    delete: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Desvincular participante do estudo (soft delete)',
      parameters: [estudoIdParam, intPathParam('participanteId', 'ID do participante')],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/participantes/{participanteId}/restaurar': {
    patch: createOperation({
      tag: 'Participantes do Estudo',
      summary: 'Restaurar vínculo de participante no estudo',
      parameters: [estudoIdParam, intPathParam('participanteId', 'ID do participante')],
      errors: [403, 404, 409],
    }),
  },
};
