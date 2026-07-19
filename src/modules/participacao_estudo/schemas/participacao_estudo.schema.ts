import { z } from 'zod';

export const criarParticipacaoEstudo = z.object({
  participanteId: z.number().int().positive(),
});

export const atualizarParticipacaoEstudo = criarParticipacaoEstudo.partial();

export type CriarParticipacaoInput = z.infer<
  typeof criarParticipacaoEstudo
>;

export type atualizarParticipacaoEstudo =
  z.infer<typeof atualizarParticipacaoEstudo>;