import {
  createOperation,
  intPathParam,
  jsonBody,
  type OpenApiPaths,
} from '../openapi.helper';
import {
  importarTiposVisitaEstudoSchema,
  importarVariaveisEstudoSchema,
} from '../../modules/catalogo/schemas/catalogo.schema';
import {
  atualizarTipoVisita,
  criarTipoVisita,
  reordenarTiposVisitaSchema,
} from '../../modules/tipos_visita/schemas/tipos_visita.schema';
import {
  atualizarVariavelSchema,
  criarVariavelSchema,
  reordenarVariaveisSchema,
} from '../../modules/variaveis/schemas/variavel.schema';

const estudoIdParam = intPathParam('estudoId', 'ID do estudo');
const variavelIdParam = intPathParam('variavelId', 'ID da variável');
const tipoVisitaIdParam = intPathParam('tipoVisitaId', 'ID do tipo de visita');

export const variaveisAndTiposVisitaPaths: OpenApiPaths = {
  '/api/estudos/{estudoId}/variaveis': {
    get: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Listar variáveis ativas do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Criar variável no estudo',
      description: 'Suporta tipos `numeric`, `integer`, `boolean`, `text`, `choice` e `calculated` (com fórmula).',
      parameters: [estudoIdParam],
      requestBody: jsonBody(criarVariavelSchema),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/excluidas': {
    get: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Listar variáveis na lixeira do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/reordenar': {
    patch: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Reordenar sequência das variáveis do estudo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(reordenarVariaveisSchema),
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/importar': {
    post: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Importar variáveis do catálogo oficial ou de outro estudo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(importarVariaveisEstudoSchema),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/{variavelId}': {
    get: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Buscar variável por ID',
      parameters: [estudoIdParam, variavelIdParam],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Atualizar variável do estudo',
      parameters: [estudoIdParam, variavelIdParam],
      requestBody: jsonBody(atualizarVariavelSchema),
      errors: [400, 403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Excluir variável do estudo (soft delete)',
      parameters: [estudoIdParam, variavelIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/{variavelId}/promover-catalogo': {
    post: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Promover variável do estudo para o catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [estudoIdParam, variavelIdParam],
      successStatus: '201',
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/variaveis/{variavelId}/restaurar': {
    patch: createOperation({
      tag: 'Variáveis do Estudo',
      summary: 'Restaurar variável excluída',
      parameters: [estudoIdParam, variavelIdParam],
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita': {
    get: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Listar tipos de visita do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Criar tipo de visita no estudo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(criarTipoVisita),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita/excluidos': {
    get: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Listar tipos de visita excluídos do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita/reordenar': {
    patch: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Reordenar sequência dos tipos de visita',
      parameters: [estudoIdParam],
      requestBody: jsonBody(reordenarTiposVisitaSchema),
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita/importar': {
    post: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Importar tipos de visita do catálogo oficial ou de outro estudo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(importarTiposVisitaEstudoSchema),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita/{tipoVisitaId}': {
    get: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Buscar tipo de visita por ID',
      parameters: [estudoIdParam, tipoVisitaIdParam],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Atualizar tipo de visita do estudo',
      parameters: [estudoIdParam, tipoVisitaIdParam],
      requestBody: jsonBody(atualizarTipoVisita),
      errors: [400, 403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Excluir tipo de visita (soft delete)',
      parameters: [estudoIdParam, tipoVisitaIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/tipos-visita/{tipoVisitaId}/restaurar': {
    patch: createOperation({
      tag: 'Tipos de Visita',
      summary: 'Restaurar tipo de visita excluído',
      parameters: [estudoIdParam, tipoVisitaIdParam],
      errors: [403, 404, 409],
    }),
  },
};
