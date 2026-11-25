import { z } from 'zod';

export const criarTipoVisita = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(200).nullable().optional(),
  ordem: z.number().int().min(0).optional(),
});

export const atualizarTipoVisita = criarTipoVisita.partial();

export const reordenarTiposVisitaSchema = z.object({
  itens: z
    .array(
      z.object({
        id: z.number().int().positive(),
        ordem: z.number().int().min(0),
      })
    )
    .min(1),
});

export type CriarTipoVisitaInput = z.infer<typeof criarTipoVisita>;
export type atualizarTipoVisita = z.infer<typeof atualizarTipoVisita>;
export type ReordenarTiposVisitaInput = z.infer<typeof reordenarTiposVisitaSchema>;
