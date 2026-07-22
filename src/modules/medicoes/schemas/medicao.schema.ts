import { z } from 'zod';


export const criarMedicaoSchema = z.object({
  variavelId: z.number().int().positive(),
  valorNum: z.number().optional(),
  valorText: z.string().optional(),
  lado: z.enum(['D', 'E', 'B']).optional()
});

export const atualizarMedicaoSchema = z.object({
  valorNum: z.number().optional(),
  valorText: z.string().optional(),
  lado: z.enum(['D', 'E', 'B']).optional()
});

export type CriarMedicaoInput = z.infer<typeof criarMedicaoSchema>;
export type AtualizarMedicaoInput = z.infer<typeof atualizarMedicaoSchema>;