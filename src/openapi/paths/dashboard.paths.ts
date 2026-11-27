import { createOperation, type OpenApiPaths } from '../openapi.helper';

export const dashboardPaths: OpenApiPaths = {
  '/api/dashboard': {
    get: createOperation({
      tag: 'Dashboard',
      summary: 'Obter indicadores agregados, pendências e atividade recente',
      description:
        'Retorna contadores, pendências acionáveis e últimas visitas de avaliação filtradas pelo escopo do usuário autenticado, respeitando cegamento e soft-delete.',
      responseDataSchema: {
        type: 'object',
        properties: {
          contadores: {
            type: 'object',
            properties: {
              estudosTotal: { type: 'integer', example: 8 },
              estudosPorStatus: {
                type: 'object',
                properties: {
                  PLANEJAMENTO: { type: 'integer', example: 2 },
                  EM_ANDAMENTO: { type: 'integer', example: 3 },
                  COLETA_ENCERRADA: { type: 'integer', example: 2 },
                  ARQUIVADO: { type: 'integer', example: 1 },
                },
              },
              participantesBaseTotal: { type: 'integer', example: 142 },
              visitasUltimos7Dias: { type: 'integer', example: 19 },
              medicoesUltimos7Dias: { type: 'integer', example: 154 },
            },
          },
          pendencias: {
            type: 'object',
            properties: {
              usuariosPendentes: { type: 'integer', nullable: true, example: 3 },
              candidatosPendentesTotal: { type: 'integer', example: 7 },
              candidatosPorEstudo: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    estudoId: { type: 'integer' },
                    sigla: { type: 'string' },
                    nome: { type: 'string' },
                    quantidade: { type: 'integer' },
                  },
                },
              },
              estudosProntosParaRevelacao: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    estudoId: { type: 'integer' },
                    sigla: { type: 'string' },
                    nome: { type: 'string' },
                    status: { type: 'string', enum: ['COLETA_ENCERRADA', 'ARQUIVADO'] },
                  },
                },
              },
              estudosPlanejamentoIncompletos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    estudoId: { type: 'integer' },
                    sigla: { type: 'string' },
                    nome: { type: 'string' },
                    faltaVariaveis: { type: 'boolean' },
                    faltaTiposVisita: { type: 'boolean' },
                  },
                },
              },
            },
          },
          atividadeRecente: {
            type: 'object',
            properties: {
              ultimasVisitas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    visitaId: { type: 'integer' },
                    data: { type: 'string', format: 'date-time' },
                    estudoId: { type: 'integer' },
                    estudoSigla: { type: 'string' },
                    estudoNome: { type: 'string' },
                    participanteId: { type: 'integer' },
                    participanteCodigo: { type: 'string' },
                    tipoVisitaNome: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }),
  },
};
