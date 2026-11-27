import type { OpenApiPaths, OpenApiSchema } from './openapi.helper';
import { authAndPublicPaths } from './paths/auth-public.paths';
import { cegamentoAndRecrutamentoPaths } from './paths/cegamento-recrutamento.paths';
import { coletaDadosPaths } from './paths/coleta-dados.paths';
import { dashboardPaths } from './paths/dashboard.paths';
import { estudosPaths } from './paths/estudos.paths';
import { usuariosAndCatalogoPaths } from './paths/usuarios-catalogo.paths';
import { variaveisAndTiposVisitaPaths } from './paths/variaveis-visitas.paths';

const errorSchema: OpenApiSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string', example: 'Validation error.' },
        details: { nullable: true },
      },
      required: ['code', 'message'],
    },
  },
  required: ['success', 'error'],
};

function makeErrorResponse(description: string, exampleCode: string, exampleMessage: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          success: false,
          error: {
            code: exampleCode,
            message: exampleMessage,
          },
        },
      },
    },
  };
}

const allPaths: OpenApiPaths = {
  ...authAndPublicPaths,
  ...dashboardPaths,
  ...usuariosAndCatalogoPaths,
  ...estudosPaths,
  ...variaveisAndTiposVisitaPaths,
  ...cegamentoAndRecrutamentoPaths,
  ...coletaDadosPaths,
};

export function buildOpenApiSpec(serverUrl?: string): Record<string, unknown> {
  const servers = [
    ...(serverUrl ? [{ url: serverUrl, description: 'Servidor atual' }] : []),
    { url: '/', description: 'Origem atual (relativa)' },
  ];

  return {
    openapi: '3.0.3',
    info: {
      title: 'BioRehab Lab — API',
      version: '1.0.0',
      description:
        'Documentação interativa da API REST do sistema de coleta e gestão de dados científicos do BioRehab Lab.\n\n' +
        '**Autenticação:** faça login em `POST /api/auth/login` e informe o JWT retornado no botão **Authorize** (`Bearer <token>`).\n\n' +
        '**Controle de Acesso e Cegamento:** rotas de estudo aplicam RBAC (`isAdmin`, `owner`, `study_admin`, `collector`, `interventionist`, `viewer`) e ocultam dados de grupo/intervenções quando o cegamento está ativo (`403 BLINDING_RESTRICTED`).',
    },
    servers,
    tags: [
      { name: 'Autenticação e Saúde', description: 'Cadastro, login JWT, sessão atual e health check' },
      { name: 'Recrutamento Público', description: 'Formulário público de triagem e inscrição de voluntários' },
      { name: 'Usuários e Pendentes', description: 'Aprovação de cadastros pendentes e gestão de usuários' },
      { name: 'Catálogo Oficial', description: 'Catálogo global de variáveis e tipos de visita reutilizáveis' },
      { name: 'Dashboard', description: 'Indicadores agregados, pendências acionáveis e atividade recente' },
      { name: 'Estudos', description: 'CRUD, lixeira e ciclo de vida (`status`) dos estudos' },
      { name: 'Permissões do Estudo', description: 'Gestão de papéis da equipe por estudo' },
      { name: 'Participantes do Estudo', description: 'Vínculo de participantes aos estudos e códigos' },
      { name: 'Variáveis do Estudo', description: 'Dicionário de variáveis, ordenação, catálogo e fórmulas' },
      { name: 'Tipos de Visita', description: 'Momentos de coleta por estudo' },
      { name: 'Cegamento e Intervenções', description: 'Grupos, alocações, quebra emergencial, revelação e intervenções' },
      { name: 'Recrutamento e Candidatos', description: 'Configuração de triagem e conversão de candidatos' },
      { name: 'Participantes (Global)', description: 'Cadastro global de voluntários' },
      { name: 'Visitas', description: 'Registro de visitas longitudinais de uma participação' },
      { name: 'Medições', description: 'Coleta de valores e cálculo automático de variáveis derivadas' },
      { name: 'Importação Assistida', description: 'Upload, validação, mapeamento e histórico de planilhas' },
      { name: 'Exportação', description: 'Exportação de dados em CSV ou XLSX (layout long ou wide)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido em POST /api/auth/login',
        },
      },
      schemas: {
        ApiError: errorSchema,
      },
      responses: {
        BadRequestError: makeErrorResponse('Requisição inválida.', 'BAD_REQUEST', 'Dados ou parâmetros inválidos.'),
        UnauthorizedError: makeErrorResponse(
          'Token ausente, malformado ou expirado.',
          'AUTH_TOKEN_MISSING',
          'Não foi possível autenticar a solicitação.'
        ),
        ForbiddenError: makeErrorResponse(
          'Sem permissão para esta operação ou bloqueado por regra de cegamento.',
          'FORBIDDEN',
          'Você não tem permissão para esta ação.'
        ),
        NotFoundError: makeErrorResponse('Recurso não encontrado.', 'RESOURCE_NOT_FOUND', 'Recurso não encontrado.'),
        ConflictError: makeErrorResponse('Conflito de estado ou duplicidade.', 'CONFLICT', 'Registro já existente.'),
        ValidationError: makeErrorResponse(
          'Erro de validação nos dados enviados (Zod).',
          'VALIDATION_ERROR',
          'Validation error.'
        ),
      },
    },
    paths: allPaths,
  };
}
