import { DataType } from '@prisma/client';
import { z } from 'zod';

export const novaVariavelInlineSchema = z.object({
  nome: z.string().min(2).max(100),
  unidade: z.string().max(20).nullable().optional(),
  dataType: z.enum([
    DataType.numeric,
    DataType.integer,
    DataType.boolean,
    DataType.text,
    DataType.choice,
  ]),
  allowMultiple: z.boolean().optional().default(false),
  options: z.union([z.string().max(4000), z.array(z.string().min(1).max(200))]).nullable().optional(),
});

export const novoTipoVisitaInlineSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(200).nullable().optional(),
});

export const mapeamentoColunaSchema = z.object({
  coluna: z.string().min(1),
  destino: z.enum([
    'ignorar',
    'participante_codigo',
    'participante_nome',
    'participante_sexo',
    'participante_nascimento',
    'participante_telefone',
    'visita_tipo',
    'visita_data',
    'variavel',
  ]),
  variavelId: z.number().int().positive().optional(),
  novaVariavelNome: z.string().min(2).max(100).optional(),
  tipoVisitaId: z.number().int().positive().optional(),
  novoTipoVisitaNome: z.string().min(2).max(100).optional(),
});

export const executarImportacaoSchema = z.object({
  sessionId: z.string().min(1),
  aba: z.string().optional(),
  layout: z.enum(['long', 'wide']).default('long'),
  politicaConflito: z.enum(['pular', 'atualizar']).default('pular'),
  pularLinhasInvalidas: z.boolean().default(true),
  permitirCriarEstrutura: z.boolean().default(false),
  tipoVisitaPadraoId: z.number().int().positive().optional(),
  tipoVisitaPadraoNome: z.string().min(2).max(100).optional(),
  dataVisitaPadrao: z.coerce.date().optional(),
  novasVariaveis: z.array(novaVariavelInlineSchema).optional().default([]),
  novosTiposVisita: z.array(novoTipoVisitaInlineSchema).optional().default([]),
  mapeamento: z.array(mapeamentoColunaSchema).min(1),
});

export type MapeamentoColunaInput = z.infer<typeof mapeamentoColunaSchema>;
export type ExecutarImportacaoInput = z.infer<typeof executarImportacaoSchema>;
