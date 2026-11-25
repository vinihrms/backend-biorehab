import { DataType } from '@prisma/client';
import { z } from 'zod';

export const criarVariavelSchema = z.object({
  nome: z.string().min(2).max(100),
  unidade: z.string().max(20).nullable().optional(),
  dataType: z.nativeEnum(DataType),
  allowMultiple: z.boolean().optional().default(false),
  options: z.union([z.string().max(4000), z.array(z.string().min(1).max(200))]).nullable().optional(),
  ordem: z.number().int().min(0).optional(),
  formula: z.string().max(2000).nullable().optional(),
  casasDecimais: z.number().int().min(0).max(4).optional(),
});

export const atualizarVariavelSchema = criarVariavelSchema.partial();

export const reordenarVariaveisSchema = z.object({
  itens: z
    .array(
      z.object({
        id: z.number().int().positive(),
        ordem: z.number().int().min(0),
      })
    )
    .min(1),
});

export type CriarVariavelInput = z.infer<typeof criarVariavelSchema>;
export type AtualizarVariavelInput = z.infer<typeof atualizarVariavelSchema>;
export type ReordenarVariaveisInput = z.infer<typeof reordenarVariaveisSchema>;
