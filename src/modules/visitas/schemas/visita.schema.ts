import { z } from 'zod';


export const criarVisitaSchema = z.object({
  tipoVisitaId: z.number().int().positive(),
  data: z.coerce.date(),
  notes: z.string().max(1000).optional()
});

export const atualizarVisitaSchema = z.object({
  data: z.coerce.date().optional(),
  notes: z.string().max(1000).optional()
});

export type CriarVisitaInput = z.infer<typeof criarVisitaSchema>;
export type AtualizarVisitaInput = z.infer<typeof atualizarVisitaSchema>;