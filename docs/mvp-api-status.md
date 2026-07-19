# MVP da API - Cobertura Atual e Roadmap

## Objetivo

Este documento consolida o estado atual da API REST do sistema BioRehab, servindo como referência para o desenvolvimento do frontend e para o planejamento das próximas etapas do projeto.

O objetivo deste documento é responder às seguintes perguntas:

- O que já está implementado?
- O que o frontend já pode consumir?
- Quais módulos ainda faltam?
- Qual a ordem recomendada para concluir o MVP?

---

# Arquitetura Atual

A API está organizada em torno do recurso principal **Estudo**, concentrando os módulos relacionados ao domínio da pesquisa.

```text
Estudo
├── Permissões
├── Variáveis
├── Participantes do Estudo (planejado)
├── Tipos de Visita (planejado)
├── Visitas (planejado)
└── Medições (planejado)

Participantes
└── Cadastro global de participantes
```

---

# Funcionalidades Disponíveis

## ✅ Autenticação

### Rotas

```text
POST /api/auth/cadastro
POST /api/auth/login
GET  /api/auth/me
```

### O frontend já pode

- Criar contas
- Autenticar usuários
- Persistir JWT
- Recuperar a sessão atual

---

## ✅ Estudos

### Rotas

```text
GET    /api/estudos
GET    /api/estudos/excluidos
GET    /api/estudos/:estudoId
POST   /api/estudos
PATCH  /api/estudos/:estudoId
DELETE /api/estudos/:estudoId
PATCH  /api/estudos/:estudoId/restaurar
```

### Funcionalidades

- CRUD completo
- Soft delete
- Restauração
- Controle de acesso via RBAC

---

## ✅ Permissões por Estudo

### Rotas

```text
GET    /api/estudos/:estudoId/permissoes
POST   /api/estudos/:estudoId/permissoes
PATCH  /api/estudos/:estudoId/permissoes/:usuarioId
DELETE /api/estudos/:estudoId/permissoes/:usuarioId
```

### Funcionalidades

- Compartilhamento de estudos
- Gerenciamento de Owner / Collector / Viewer
- Controle de acesso por estudo

---

## ✅ Variáveis

### Rotas

```text
GET    /api/estudos/:estudoId/variaveis
GET    /api/estudos/:estudoId/variaveis/excluidas
GET    /api/estudos/:estudoId/variaveis/:variavelId
POST   /api/estudos/:estudoId/variaveis
PATCH  /api/estudos/:estudoId/variaveis/:variavelId
DELETE /api/estudos/:estudoId/variaveis/:variavelId
PATCH  /api/estudos/:estudoId/variaveis/:variavelId/restaurar
```

### Funcionalidades

- Dicionário de dados do estudo
- Soft delete
- Restauração
- Controle de acesso

---

## ✅ Participantes

### Rotas

```text
GET    /api/participantes
GET    /api/participantes/excluidos
GET    /api/participantes/:participanteId
POST   /api/participantes
PATCH  /api/participantes/:participanteId
DELETE /api/participantes/:participanteId
PATCH  /api/participantes/:participanteId/restaurar
```

### Funcionalidades

- Cadastro global de participantes
- Soft delete
- Restauração

---

# Fluxo Funcional Esperado

O fluxo completo da pesquisa deverá seguir a seguinte sequência:

```text
Criar estudo
        ↓
Cadastrar variáveis
        ↓
Cadastrar participantes
        ↓
Vincular participantes ao estudo
        ↓
Cadastrar tipos de visita
        ↓
Registrar visitas
        ↓
Registrar medições
        ↓
Consultar / Exportar dados
```

---

# Módulos Pendentes

## 1. Participantes do Estudo

Responsável por gerenciar o vínculo entre participantes e estudos.

### Rotas previstas

```text
GET    /api/estudos/:estudoId/participantes
GET    /api/estudos/:estudoId/participantes/:participanteId
POST   /api/estudos/:estudoId/participantes
DELETE /api/estudos/:estudoId/participantes/:participanteId
```

### Objetivos

- Vincular participantes ao estudo
- Listar participantes do estudo
- Remover participantes do estudo
- Validar participação antes da coleta

---

## 2. Tipos de Visita

Catálogo de visitas pertencentes a um estudo.

Exemplos:

- Baseline
- Retorno 30 dias
- Retorno 90 dias
- Alta

### Rotas previstas

```text
GET    /api/estudos/:estudoId/tipos-visita
GET    /api/estudos/:estudoId/tipos-visita/:tipoVisitaId
POST   /api/estudos/:estudoId/tipos-visita
PATCH  /api/estudos/:estudoId/tipos-visita/:tipoVisitaId
DELETE /api/estudos/:estudoId/tipos-visita/:tipoVisitaId
PATCH  /api/estudos/:estudoId/tipos-visita/:tipoVisitaId/restaurar
```

---

## 3. Visitas

Registro das visitas realizadas pelos participantes.

### Rotas previstas

```text
GET    /api/estudos/:estudoId/participantes/:participanteId/visitas
GET    /api/visitas/:visitaId
POST   /api/estudos/:estudoId/participantes/:participanteId/visitas
PATCH  /api/visitas/:visitaId
DELETE /api/visitas/:visitaId
```

---

## 4. Medições

Registro dos valores coletados durante cada visita.

### Rotas previstas

```text
GET    /api/visitas/:visitaId/medicoes
POST   /api/visitas/:visitaId/medicoes
PATCH  /api/medicoes/:medicaoId
DELETE /api/medicoes/:medicaoId
```

Responsabilidades:

- Validar tipo da variável
- Armazenar valor
- Garantir consistência da coleta

---

## 5. Consultas e Exportação

### Objetivos

- Consultas consolidadas
- Filtros
- Exportação CSV
- Exportação JSON

---

## 6. Refinamentos

Itens planejados para estabilização da API.

- Swagger / OpenAPI
- Revisão completa do RBAC
- Validação de usuário ativo
- Padronização dos códigos HTTP
- Auditoria
- Melhorias de performance

---

# Roadmap

## ✅ Fase 1 — Administração (Concluída)

- [x] Autenticação
- [x] Estudos
- [x] Permissões
- [x] Variáveis
- [x] Participantes

Resultado:

Sistema capaz de administrar estudos.

---

## 🚧 Fase 2 — Coleta

- [ ] Participantes do Estudo
- [ ] Tipos de Visita
- [ ] Visitas
- [ ] Medições

Resultado:

Sistema capaz de realizar coletas completas.

---

## 🚀 Fase 3 — Produto

- [ ] Consultas
- [ ] Exportação
- [ ] Swagger
- [ ] Ajustes de segurança
- [ ] Testes finais

Resultado:

MVP pronto para utilização em ambiente de pesquisa.

---

# Checklist Geral

## Concluído

- [x] Autenticação
- [x] Estudos
- [x] Permissões
- [x] Variáveis
- [x] Participantes

## Em desenvolvimento

- [ ] Participantes do Estudo
- [ ] Tipos de Visita
- [ ] Visitas
- [ ] Medições

## Planejado

- [ ] Consultas
- [ ] Exportação
- [ ] Swagger/OpenAPI
- [ ] Refinamentos de segurança
- [ ] Testes finais

---

# Conclusão

Atualmente a API já suporta todo o fluxo de administração do sistema, permitindo o gerenciamento de usuários, estudos, permissões, participantes e variáveis.

Os próximos módulos concentram-se na etapa de coleta científica, que representa o núcleo funcional da aplicação.

Após a implementação de Participantes do Estudo, Tipos de Visita, Visitas e Medições, a API estará apta a suportar estudos longitudinais completos.

A etapa final será dedicada à disponibilização de consultas, exportação de dados e refinamentos de segurança, consolidando um MVP funcional para utilização pela equipe de pesquisa do BioRehab.