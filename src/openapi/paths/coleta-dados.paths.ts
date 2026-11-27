import {
  createOperation,
  intPathParam,
  jsonBody,
  type OpenApiPaths,
} from '../openapi.helper';
import { exportarEstudoSchema } from '../../modules/export/schemas/export.schema';
import { executarImportacaoSchema } from '../../modules/importacao/schemas/importacao.schema';
import { atualizarMedicaoSchema, criarMedicaoSchema } from '../../modules/medicoes/schemas/medicao.schema';
import {
  atualizarParticipanteSchema,
  criarParticipanteSchema,
} from '../../modules/participantes/schemas/participante.schema';
import { atualizarVisitaSchema, criarVisitaSchema } from '../../modules/visitas/schemas/visita.schema';

const estudoIdParam = intPathParam('estudoId', 'ID do estudo');
const participanteIdParam = intPathParam('participanteId', 'ID do participante');
const participacaoIdParam = intPathParam('participacaoId', 'ID da participação no estudo');
const visitaIdParam = intPathParam('visitaId', 'ID da visita');
const medicaoIdParam = intPathParam('medicaoId', 'ID da medição');

export const coletaDadosPaths: OpenApiPaths = {
  '/api/participantes': {
    get: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Listar participantes ativos',
    }),
    post: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Cadastrar novo participante global',
      requestBody: jsonBody(criarParticipanteSchema),
      successStatus: '201',
      errors: [400, 409],
    }),
  },

  '/api/participantes/excluidos': {
    get: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Listar participantes na lixeira',
    }),
  },

  '/api/participantes/{participanteId}': {
    get: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Buscar participante por ID',
      parameters: [participanteIdParam],
      errors: [404],
    }),
    patch: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Atualizar dados cadastrais do participante',
      parameters: [participanteIdParam],
      requestBody: jsonBody(atualizarParticipanteSchema),
      errors: [400, 404],
    }),
    delete: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Mover participante para a lixeira (soft delete)',
      parameters: [participanteIdParam],
      errors: [404, 409],
    }),
  },

  '/api/participantes/{participanteId}/restaurar': {
    patch: createOperation({
      tag: 'Participantes (Global)',
      summary: 'Restaurar participante excluído',
      parameters: [participanteIdParam],
      errors: [404, 409],
    }),
  },

  '/api/participacoes/{participacaoId}/visitas': {
    get: createOperation({
      tag: 'Visitas',
      summary: 'Listar visitas de uma participação',
      parameters: [participacaoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Visitas',
      summary: 'Registrar nova visita de coleta',
      parameters: [participacaoIdParam],
      requestBody: jsonBody(criarVisitaSchema),
      successStatus: '201',
      errors: [400, 403, 404],
    }),
  },

  '/api/participacoes/{participacaoId}/visitas/excluidas': {
    get: createOperation({
      tag: 'Visitas',
      summary: 'Listar visitas na lixeira da participação',
      parameters: [participacaoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/participacoes/{participacaoId}/visitas/{visitaId}': {
    get: createOperation({
      tag: 'Visitas',
      summary: 'Buscar visita por ID',
      parameters: [participacaoIdParam, visitaIdParam],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Visitas',
      summary: 'Atualizar visita',
      parameters: [participacaoIdParam, visitaIdParam],
      requestBody: jsonBody(atualizarVisitaSchema),
      errors: [400, 403, 404],
    }),
    delete: createOperation({
      tag: 'Visitas',
      summary: 'Excluir visita (soft delete)',
      parameters: [participacaoIdParam, visitaIdParam],
      errors: [403, 404],
    }),
  },

  '/api/participacoes/{participacaoId}/visitas/{visitaId}/restaurar': {
    patch: createOperation({
      tag: 'Visitas',
      summary: 'Restaurar visita excluída',
      parameters: [participacaoIdParam, visitaIdParam],
      errors: [403, 404, 409],
    }),
  },

  '/api/visitas/{visitaId}/medicoes': {
    get: createOperation({
      tag: 'Medições',
      summary: 'Listar medições de uma visita',
      parameters: [visitaIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Medições',
      summary: 'Registrar medição em uma visita',
      description:
        'Valida o valor conforme o `dataType` da variável e recalcula automaticamente variáveis `calculated` dependentes.',
      parameters: [visitaIdParam],
      requestBody: jsonBody(criarMedicaoSchema),
      successStatus: '201',
      errors: [400, 403, 404],
    }),
  },

  '/api/visitas/{visitaId}/medicoes/excluidas': {
    get: createOperation({
      tag: 'Medições',
      summary: 'Listar medições na lixeira da visita',
      parameters: [visitaIdParam],
      errors: [403, 404],
    }),
  },

  '/api/visitas/{visitaId}/medicoes/{medicaoId}': {
    get: createOperation({
      tag: 'Medições',
      summary: 'Buscar medição por ID',
      parameters: [visitaIdParam, medicaoIdParam],
      errors: [403, 404],
    }),
    patch: createOperation({
      tag: 'Medições',
      summary: 'Atualizar medição',
      parameters: [visitaIdParam, medicaoIdParam],
      requestBody: jsonBody(atualizarMedicaoSchema),
      errors: [400, 403, 404],
    }),
    delete: createOperation({
      tag: 'Medições',
      summary: 'Excluir medição (soft delete)',
      parameters: [visitaIdParam, medicaoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/visitas/{visitaId}/medicoes/{medicaoId}/restaurar': {
    patch: createOperation({
      tag: 'Medições',
      summary: 'Restaurar medição excluída',
      parameters: [visitaIdParam, medicaoIdParam],
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/importacao/analisar': {
    post: createOperation({
      tag: 'Importação Assistida',
      summary: 'Enviar planilha (CSV/XLSX) para análise e pré-mapeamento',
      description:
        'Recebe `multipart/form-data` com o campo `arquivo` (limite de 15 MB) e retorna `sessionId`, abas, colunas detectadas e sugestões de mapeamento.',
      parameters: [estudoIdParam],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['arquivo'],
              properties: {
                arquivo: {
                  type: 'string',
                  format: 'binary',
                  description: 'Planilha CSV ou XLSX (máx. 15 MB).',
                },
              },
            },
          },
        },
      },
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/importacao/validar': {
    post: createOperation({
      tag: 'Importação Assistida',
      summary: 'Simular e validar mapeamento antes de gravar no banco',
      parameters: [estudoIdParam],
      requestBody: jsonBody(executarImportacaoSchema),
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/importacao/confirmar': {
    post: createOperation({
      tag: 'Importação Assistida',
      summary: 'Confirmar e persistir importação da planilha',
      parameters: [estudoIdParam],
      requestBody: jsonBody(executarImportacaoSchema),
      successStatus: '201',
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/importacao/logs': {
    get: createOperation({
      tag: 'Importação Assistida',
      summary: 'Listar histórico de importações do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/exportar': {
    post: createOperation({
      tag: 'Exportação',
      summary: 'Exportar dados do estudo em CSV ou XLSX',
      description:
        'Suporta layout `long` ou `wide` e respeita regras de cegamento (oculta coluna de grupo e aba de métodos quando o usuário está cegado).',
      parameters: [estudoIdParam],
      requestBody: jsonBody(exportarEstudoSchema),
      responses: {
        '200': {
          description: 'Arquivo gerado para download (`Content-Disposition: attachment`).',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
      },
      errors: [400, 403, 404],
    }),
  },
};
