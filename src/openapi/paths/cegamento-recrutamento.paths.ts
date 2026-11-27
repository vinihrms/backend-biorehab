import { StatusCandidato } from '@prisma/client';
import {
  createOperation,
  intPathParam,
  jsonBody,
  type OpenApiPaths,
  queryParam,
} from '../openapi.helper';
import {
  alocarEmLoteSchema,
  alocarParticipanteSchema,
  atualizarGrupoEstudoSchema,
  atualizarIntervencaoSchema,
  criarGrupoEstudoSchema,
  criarIntervencaoSchema,
  quebraEmergencialSchema,
} from '../../modules/cegamento/schemas/cegamento.schema';
import {
  atualizarCandidatoSchema,
  salvarFormularioRecrutamentoSchema,
} from '../../modules/recrutamento/schemas/recrutamento.schema';

const estudoIdParam = intPathParam('estudoId', 'ID do estudo');
const grupoIdParam = intPathParam('grupoId', 'ID do grupo do estudo');
const participacaoIdParam = intPathParam('participacaoId', 'ID da participação do voluntário no estudo');
const intervencaoIdParam = intPathParam('intervencaoId', 'ID do registro de intervenção');
const candidatoIdParam = intPathParam('candidatoId', 'ID do candidato inscrito');

export const cegamentoAndRecrutamentoPaths: OpenApiPaths = {
  '/api/estudos/{estudoId}/grupos': {
    get: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Listar grupos do estudo',
      description:
        'Em estudo cego ativo (`estudoCego=true` e `cegamentoQuebradoEm=null`): `interventionist` sempre acessa; `owner`/`study_admin`/`isAdmin` acessam apenas em `PLANEJAMENTO`; `collector` e `viewer` recebem `403 BLINDING_RESTRICTED`.',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Criar grupo/braço do estudo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(criarGrupoEstudoSchema),
      successStatus: '201',
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/grupos/{grupoId}': {
    patch: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Atualizar grupo do estudo',
      parameters: [estudoIdParam, grupoIdParam],
      requestBody: jsonBody(atualizarGrupoEstudoSchema),
      errors: [403, 404, 409],
    }),
    delete: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Remover grupo do estudo',
      parameters: [estudoIdParam, grupoIdParam],
      errors: [403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/alocacoes': {
    get: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Consultar alocações de grupo dos participantes',
      description:
        'Em estudo cego ativo: `interventionist` tem visibilidade completa; `owner`/`isAdmin` têm visibilidade parcial apenas de quebras emergenciais; `collector`, `viewer` e `study_admin` recebem `403 BLINDING_RESTRICTED`.',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Alocar participante em um grupo',
      parameters: [estudoIdParam],
      requestBody: jsonBody(alocarParticipanteSchema),
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/alocacoes/lote': {
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Alocar participantes em lote',
      parameters: [estudoIdParam],
      requestBody: jsonBody(alocarEmLoteSchema),
      successStatus: '201',
      errors: [400, 403, 404],
    }),
  },

  '/api/estudos/{estudoId}/alocacoes/{participacaoId}/quebrar-cegamento': {
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Registrar quebra emergencial individual de cegamento',
      description: 'Restrito a `owner` ou `isAdmin`, exigindo justificativa.',
      parameters: [estudoIdParam, participacaoIdParam],
      requestBody: jsonBody(quebraEmergencialSchema),
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/estudos/{estudoId}/revelar-cegamento': {
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Revelar cegamento oficial do estudo',
      description: 'Libera os grupos e alocações para análise final (restrito a `owner`/`isAdmin`).',
      parameters: [estudoIdParam],
      errors: [400, 403, 404, 409],
    }),
  },

  '/api/participacoes/{participacaoId}/intervencoes': {
    get: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Listar intervenções aplicadas a uma participação',
      description:
        'Em estudo cego ativo, protegido contra visualização por `collector`, `viewer` e `study_admin` (`403 BLINDING_RESTRICTED`).',
      parameters: [participacaoIdParam],
      errors: [403, 404],
    }),
    post: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Registrar aplicação de intervenção',
      parameters: [participacaoIdParam],
      requestBody: jsonBody(criarIntervencaoSchema),
      successStatus: '201',
      errors: [400, 403, 404],
    }),
  },

  '/api/participacoes/{participacaoId}/intervencoes/{intervencaoId}': {
    patch: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Atualizar registro de intervenção',
      parameters: [participacaoIdParam, intervencaoIdParam],
      requestBody: jsonBody(atualizarIntervencaoSchema),
      errors: [403, 404],
    }),
    delete: createOperation({
      tag: 'Cegamento e Intervenções',
      summary: 'Remover registro de intervenção',
      parameters: [participacaoIdParam, intervencaoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/recrutamento': {
    get: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Consultar configuração do formulário de recrutamento do estudo',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
    put: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Criar ou atualizar formulário de recrutamento e triagem',
      parameters: [estudoIdParam],
      requestBody: jsonBody(salvarFormularioRecrutamentoSchema),
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/recrutamento/regenerar-token': {
    post: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Regenerar token público do link de recrutamento',
      parameters: [estudoIdParam],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/candidatos': {
    get: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Listar candidatos inscritos na triagem do estudo',
      parameters: [
        estudoIdParam,
        queryParam('status', 'Filtrar por status do candidato', {
          type: 'string',
          enum: Object.values(StatusCandidato),
        }),
      ],
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/candidatos/{candidatoId}': {
    patch: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Atualizar status ou notas de contato do candidato',
      parameters: [estudoIdParam, candidatoIdParam],
      requestBody: jsonBody(atualizarCandidatoSchema),
      errors: [403, 404],
    }),
  },

  '/api/estudos/{estudoId}/candidatos/{candidatoId}/converter': {
    post: createOperation({
      tag: 'Recrutamento e Candidatos',
      summary: 'Converter candidato aprovado em participante vinculado ao estudo',
      parameters: [estudoIdParam, candidatoIdParam],
      successStatus: '201',
      errors: [400, 403, 404, 409],
    }),
  },
};
