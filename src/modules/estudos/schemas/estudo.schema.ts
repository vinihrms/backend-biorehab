import { z } from 'zod';

export const criarEstudoSchema = z.object({
  nome: z.string().min(3).max(100),
  sigla: z.string().max(10).optional(),
  descricao: z.string().optional(),
});

export type CriarEstudoInput =
  z.infer<typeof criarEstudoSchema>;