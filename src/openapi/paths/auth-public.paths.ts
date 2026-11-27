import {
  createOperation,
  jsonBody,
  type OpenApiPaths,
  strPathParam,
} from '../openapi.helper';
import { loginSchema } from '../../modules/auth/schemas/login.schema';
import { cadastrarUsuarioSchema } from '../../modules/auth/schemas/register.schema';
import { inscricaoPublicaSchema } from '../../modules/recrutamento/schemas/recrutamento.schema';

export const authAndPublicPaths: OpenApiPaths = {
  '/api/health': {
    get: createOperation({
      tag: 'Autenticação e Saúde',
      summary: 'Health check do servidor',
      isPublic: true,
      successDescription: 'Servidor online.',
      responses: {
        '200': {
          description: 'Servidor online.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  message: { type: 'string', example: 'Backend do BioRehab Lab online!' },
                },
              },
            },
          },
        },
      },
    }),
  },

  '/api/ping': {
    get: createOperation({
      tag: 'Autenticação e Saúde',
      summary: 'Ping de conectividade',
      isPublic: true,
      responses: {
        '200': {
          description: 'Pong com timestamp ISO.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'pong' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    }),
  },

  '/api/auth/cadastro': {
    post: createOperation({
      tag: 'Autenticação e Saúde',
      summary: 'Cadastrar novo usuário',
      description: 'Cria uma conta pendente de aprovação administrativa (`isActive = false`).',
      isPublic: true,
      requestBody: jsonBody(cadastrarUsuarioSchema),
      successStatus: '201',
      successDescription: 'Usuário cadastrado com sucesso (aguardando ativação).',
      errors: [409],
    }),
  },

  '/api/auth/login': {
    post: createOperation({
      tag: 'Autenticação e Saúde',
      summary: 'Autenticar usuário (JWT)',
      description: 'Retorna o token JWT para uso no cabeçalho `Authorization: Bearer <token>`.',
      isPublic: true,
      requestBody: jsonBody(loginSchema),
      successDescription: 'Login efetuado com sucesso.',
      errors: [401, 403],
    }),
  },

  '/api/auth/me': {
    get: createOperation({
      tag: 'Autenticação e Saúde',
      summary: 'Consultar dados da sessão autenticada',
      description: 'Retorna `id`, `isAdmin` e `canCreateStudy` do usuário autenticado.',
    }),
  },

  '/api/public/recrutamento/{tokenPublico}': {
    get: createOperation({
      tag: 'Recrutamento Público',
      summary: 'Obter formulário público de triagem',
      description: 'Rota pública acessada por voluntários através do link compartilhável do estudo.',
      isPublic: true,
      parameters: [strPathParam('tokenPublico', 'Token público do formulário de recrutamento')],
      errors: [404],
    }),
  },

  '/api/public/recrutamento/{tokenPublico}/inscricoes': {
    post: createOperation({
      tag: 'Recrutamento Público',
      summary: 'Enviar inscrição pública de voluntário',
      description: 'Registra um novo candidato na triagem do estudo sem necessidade de autenticação.',
      isPublic: true,
      parameters: [strPathParam('tokenPublico', 'Token público do formulário de recrutamento')],
      requestBody: jsonBody(inscricaoPublicaSchema),
      successStatus: '201',
      successDescription: 'Inscrição enviada com sucesso.',
      errors: [400, 404],
    }),
  },
};
