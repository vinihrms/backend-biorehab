import {
  createOperation,
  intPathParam,
  jsonBody,
  type OpenApiPaths,
  queryParam,
} from '../openapi.helper';
import {
  atualizarCatalogoTipoVisitaSchema,
  atualizarCatalogoVariavelSchema,
  criarCatalogoTipoVisitaSchema,
  criarCatalogoVariavelSchema,
} from '../../modules/catalogo/schemas/catalogo.schema';
import { atualizarUsuarioSchema } from '../../modules/usuarios/schemas/usuario.schema';

export const usuariosAndCatalogoPaths: OpenApiPaths = {
  '/api/usuarios/pendentes': {
    get: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Listar usuários pendentes de ativação',
      description: 'Restrito a administradores globais (`isAdmin`).',
      errors: [403],
    }),
  },

  '/api/usuarios/pendentes/{usuarioId}/aceitar': {
    patch: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Aprovar e ativar usuário pendente',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('usuarioId', 'ID do usuário pendente')],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                canCreateStudy: {
                  type: 'boolean',
                  description: 'Define se o usuário aprovado poderá criar novos estudos.',
                },
              },
            },
          },
        },
      },
      errors: [403, 404],
    }),
  },

  '/api/usuarios/pendentes/{usuarioId}/recusar': {
    delete: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Recusar usuário pendente',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('usuarioId', 'ID do usuário pendente')],
      errors: [403, 404],
    }),
  },

  '/api/usuarios/buscar': {
    get: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Buscar usuários ativos para compartilhamento',
      parameters: [queryParam('q', 'Filtro opcional por nome, email ou RA')],
    }),
  },

  '/api/usuarios': {
    get: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Listar usuários',
      description: 'Restrito a administradores globais (`isAdmin`).',
      errors: [403],
    }),
  },

  '/api/usuarios/{usuarioId}': {
    get: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Buscar usuário por ID',
      parameters: [intPathParam('usuarioId', 'ID do usuário')],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Atualizar usuário',
      parameters: [intPathParam('usuarioId', 'ID do usuário')],
      requestBody: jsonBody(atualizarUsuarioSchema),
      errors: [403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Usuários e Pendentes',
      summary: 'Excluir usuário (soft delete)',
      parameters: [intPathParam('usuarioId', 'ID do usuário')],
      successStatus: '204',
      errors: [403, 404],
    }),
  },

  '/api/catalogo/variaveis': {
    get: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Listar variáveis do catálogo oficial',
      parameters: [queryParam('q', 'Termo opcional de busca no catálogo')],
    }),
    post: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Criar variável no catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      requestBody: jsonBody(criarCatalogoVariavelSchema),
      successStatus: '201',
      errors: [400, 403, 409],
    }),
  },

  '/api/catalogo/variaveis/{catalogoId}': {
    patch: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Atualizar variável do catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('catalogoId', 'ID da variável no catálogo')],
      requestBody: jsonBody(atualizarCatalogoVariavelSchema),
      errors: [400, 403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Remover variável do catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('catalogoId', 'ID da variável no catálogo')],
      errors: [403, 404],
    }),
  },

  '/api/catalogo/tipos-visita': {
    get: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Listar tipos de visita do catálogo oficial',
      parameters: [queryParam('q', 'Termo opcional de busca no catálogo')],
    }),
    post: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Criar tipo de visita no catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      requestBody: jsonBody(criarCatalogoTipoVisitaSchema),
      successStatus: '201',
      errors: [403, 409],
    }),
  },

  '/api/catalogo/tipos-visita/{catalogoId}': {
    patch: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Atualizar tipo de visita do catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('catalogoId', 'ID do tipo de visita no catálogo')],
      requestBody: jsonBody(atualizarCatalogoTipoVisitaSchema),
      errors: [403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Catálogo Oficial',
      summary: 'Remover tipo de visita do catálogo oficial',
      description: 'Restrito a administradores globais (`isAdmin`).',
      parameters: [intPathParam('catalogoId', 'ID do tipo de visita no catálogo')],
      errors: [403, 404],
    }),
  },
};
