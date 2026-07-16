# BioRehab Lab - TO DO Tecnico do Backend

Documento de acompanhamento dos problemas atuais do sistema, com localizacao dos erros e ordem recomendada de correcao.

## Objetivo

- Reduzir risco de seguranca.
- Corrigir inconsistencias de regra de negocio.
- Consolidar a arquitetura em camadas prevista no documento tecnico.
- Preparar o backend para crescer de forma previsivel.

## Prioridade 1 - Falhas criticas

### 2. Implementar autorizacao real por estudo


### 3. Separar criacao de participante da vinculacao ao estudo

- Problema: a criacao de participante pode ser aberta para qualquer usuario autenticado, mas o vinculo ao estudo precisa ser controlado.
- Risco: hoje falta separar claramente a criacao do participante da associacao dele a um estudo.
- Localizacao:
  - `src/modules/participantes/services/ParticipanteService.ts`
  - `src/modules/participantes/controllers/ParticipanteController.ts`
- Acao:
  - Permitir criacao de participante para qualquer usuario autenticado.
  - Permitir vincular participante a estudo somente para `collector` e `owner`.
  - Definir quais papeis podem editar, excluir e restaurar.

## Prioridade 2 - Quebras funcionais

### 4. Completar o modulo de variaveis

- Problema: o controller e o service de variaveis estao incompletos.
- Risco: a rota existe, mas nao entrega comportamento confiavel.
- Localizacao:
  - `src/modules/variaveis/controllers/VariavelController.ts`
  - `src/modules/variaveis/services/VariavelService.ts`
  - `src/modules/variaveis/repositories/VariavelRepository.ts`
- Acao:
  - Implementar listagem, criacao, edicao e exclusao.
  - Aplicar validação do tipo de dado e dependencia por estudo.

### 5. Corrigir rota com typo

- Problema: existe rota com nome incorreto em `variveis`.
- Risco: quebra integracao com frontend e consumidores externos.
- Localizacao:
  - `src/routes.ts`
- Acao:
  - Corrigir para `/variaveis`.

### 6. Validar usuario ativo no middleware de autenticacao

- Problema: o middleware valida apenas o JWT, nao o estado atual do usuario.
- Risco: usuario desativado continua acessando a API com token valido.
- Localizacao:
  - `src/middlewares/auth.middleware.ts`
- Acao:
  - Buscar usuario no banco antes de liberar a requisicao.
  - Bloquear usuarios inativos ou removidos.

## Prioridade 3 - Consistencia arquitetural

### 7. Unificar auth e usuarios

- Problema: auth e usuarios ainda possuem sobreposicao de responsabilidade.
- Risco: duplicacao de regra, imports confusos e manutencao cara.
- Localizacao:
  - `src/modules/auth/*`
  - `src/modules/usuarios/*`
- Acao:
  - Definir um unico dono para cadastro/login.
  - Manter `usuarios` para CRUD administrativo e `auth` para identidade/autenticacao.

### 8. Unificar autorizacao e permissao

- Problema: existem caminhos paralelos para permissao (`permissao_estudos` e `rbac`).
- Risco: duplicacao de regra e comportamento divergente.
- Localizacao:
  - `src/modules/permissao_estudos/*`
  - `src/modules/rbac/*`
- Acao:
  - Escolher uma estrutura final.
  - Eliminar duplicidade.

### 9. Revisar base repository e tipagem geral

- Problema: a camada base precisa estar consistente para todos os repositorios.
- Risco: erros de compilacao e dependencia indevida entre modules.
- Localizacao:
  - `src/repositories/base.repository.ts`
  - `src/modules/*/repositories/*`
- Acao:
  - Garantir padrao unico de repositorio.
  - Tipar inputs e retornos com Zod + Prisma.

## Prioridade 4 - Regras de negocio futuras

### 10. Implementar visitas e medicoes

- Problema: o dominio principal de coleta longitudinal ainda nao foi consolidado.
- Risco: o sistema nao fecha o ciclo cientifico de coleta de dados.
- Localizacao esperada:
  - `src/modules/visitas/*`
  - `src/modules/medicoes/*`
- Acao:
  - Criar o fluxo de visita.
  - Validar medicao contra o tipo da variavel.

### 11. Implementar consultas e exportacao

- Problema: ainda nao existem endpoints de leitura otimizados para exportacao.
- Risco: dificulta analise cientifica e integracao futura.
- Localizacao esperada:
  - `src/modules/consultas/*`
  - `src/modules/exportacoes/*`
- Acao:
  - Criar filtros, ordenacao e exportacao CSV/JSON.

## Erros ja identificados no codigo

- `src/routes.ts`
  - Rota com typo: `/api/estudos/:estudoId/variveis`.
  - Rotas misturam responsabilidades de auth, estudos, permissao e participantes sem policy centralizada.
- `src/modules/auth/services/AuthService.ts`
  - Fluxo de cadastro ainda aceitava `isAdmin` no payload.
  - Mistura de responsabilidade entre identidade e cadastro de usuario.
- `src/modules/estudos/services/EstudoService.ts`
  - Regras de acesso ainda centralizadas em `AdminAuthorization`.
- `src/modules/permissao_estudos/services/PermissaoEstudoService.ts`
  - Mesma dependencia de admin, em desacordo com o modelo owner/collector/viewer.
- `src/modules/participantes/services/ParticipanteService.ts`
  - RBAC nao aplicado de forma efetiva.
- `src/modules/variaveis/controllers/VariavelController.ts`
  - Resposta usa variavel inexistente e o service nao esta implementado.
- `src/middlewares/auth.middleware.ts`
  - Nao valida usuario ativo no banco.

## Ordem recomendada de execucao

1. Corrigir seguranca do cadastro e validar usuario ativo no middleware.
2. Implementar autorizacao por estudo baseada em papel.
3. Proteger participantes com RBAC.
4. Completar variaveis.
5. Consolidar auth/usuarios e permissao/rbac.
6. Implementar visitas e medicoes.
7. Criar consultas e exportacao.

## Observacao final

Este backlog deve ser usado junto com `docs/biorehab-architecture.md`.
O documento de arquitetura define o destino; este TO DO define a ordem para chegar la.
