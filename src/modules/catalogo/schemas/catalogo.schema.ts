import { DataType } from '@prisma/client';
import { z } from 'zod';

export const criarCatalogoVariavelSchema = z.object({
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
  descricao: z.string().max(1000).nullable().optional(),
});

export const atualizarCatalogoVariavelSchema = criarCatalogoVariavelSchema.partial();

export const criarCatalogoTipoVisitaSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(200).nullable().optional(),
});

export const atualizarCatalogoTipoVisitaSchema = criarCatalogoTipoVisitaSchema.partial();

export const importarVariaveisEstudoSchema = z
  .object({
    catalogoIds: z.array(z.number().int().positive()).optional(),
    origemEstudoId: z.number().int().positive().optional(),
    variavelIds: z.array(z.number().int().positive()).optional(),
  })
  .refine(
    (d) => (d.catalogoIds && d.catalogoIds.length > 0) || d.origemEstudoId !== undefined,
    'Informe catalogoIds ou origemEstudoId para importação.'
  );

export const importarTiposVisitaEstudoSchema = z
  .object({
    catalogoIds: z.array(z.number().int().positive()).optional(),
    origemEstudoId: z.number().int().positive().optional(),
    tipoVisitaIds: z.array(z.number().int().positive()).optional(),
  })
  .refine(
    (d) => (d.catalogoIds && d.catalogoIds.length > 0) || d.origemEstudoId !== undefined,
    'Informe catalogoIds ou origemEstudoId para importação.'
  );

export type CriarCatalogoVariavelInput = z.infer<typeof criarCatalogoVariavelSchema>;
export type AtualizarCatalogoVariavelInput = z.infer<typeof atualizarCatalogoVariavelSchema>;
export type CriarCatalogoTipoVisitaInput = z.infer<typeof criarCatalogoTipoVisitaSchema>;
export type AtualizarCatalogoTipoVisitaInput = z.infer<typeof atualizarCatalogoTipoVisitaSchema>;
export type ImportarVariaveisEstudoInput = z.infer<typeof importarVariaveisEstudoSchema>;
export type ImportarTiposVisitaEstudoInput = z.infer<typeof importarTiposVisitaEstudoSchema>;
