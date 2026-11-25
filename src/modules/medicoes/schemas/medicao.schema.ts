import { z } from 'zod';

export const criarMedicaoSchema = z.object({
  variavelId: z.number().int().positive(),
  valorNum: z.number().optional(),
  valorText: z.string().optional(),
  valorOpcoes: z.array(z.string().min(1)).optional(),
});

export const atualizarMedicaoSchema = z.object({
  valorNum: z.number().optional(),
  valorText: z.string().optional(),
  valorOpcoes: z.array(z.string().min(1)).optional(),
});

export type CriarMedicaoInput = z.infer<typeof criarMedicaoSchema>;
export type AtualizarMedicaoInput = z.infer<typeof atualizarMedicaoSchema>;
