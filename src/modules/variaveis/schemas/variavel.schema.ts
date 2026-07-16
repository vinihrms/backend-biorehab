import { z } from 'zod';
import { DataType } from '@prisma/client';

export const criarVariavelSchema = z.object({
  nome: z.string().min(2).max(100),
  unidade: z.string().max(100).optional(),
  dataType: z.nativeEnum(DataType),
  options: z.string().max(200).optional(),
});



export const atualizarVariavelSchema = criarVariavelSchema.partial();

export type CriarVariavelInput =
  z.infer<typeof criarVariavelSchema>;

export type AtualizarVariavelInput =
  z.infer<typeof atualizarVariavelSchema>;