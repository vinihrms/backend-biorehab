import { z } from 'zod';

export const criarEstudoSchema = z.object({
  nome: z.string().min(3).max(100),
  sigla: z.string().min(1).max(10),
  descricao: z.string().optional(),
  metaParticipantes: z.number().int().positive().optional(),
  estudoCego: z.boolean().optional().default(false),
});

export const atualizarEstudoSchema = criarEstudoSchema.partial();

export type CriarEstudoInput = z.infer<typeof criarEstudoSchema>;

export type AtualizarEstudoInput = z.infer<typeof atualizarEstudoSchema>;
