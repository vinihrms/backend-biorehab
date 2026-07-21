import { Sexo } from '@prisma/client';
import { z } from 'zod';

export const criarTipoVisita = z.object({
  nome: z.string().min(3).max(100),
  descricao: z.string().max(200).optional(),
});

export const atualizarTipoVisita = criarTipoVisita.partial();

export type CriarTipoVisitaInput = z.infer<
  typeof criarTipoVisita
>;

export type atualizarTipoVisita =
  z.infer<typeof atualizarTipoVisita>;