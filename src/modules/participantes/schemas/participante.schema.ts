import { Sexo } from '@prisma/client';
import { z } from 'zod';

export const criarParticipanteSchema = z.object({
  nome: z.string().min(3).max(100),
  telefone: z.string().max(15).regex(/^\d{10,15}$/),
  sexo: z.nativeEnum(Sexo),
  nascimento: z.coerce.date(),
});

export const atualizarParticipanteSchema = criarParticipanteSchema.partial();

export type CriarParticipanteInput = z.infer<
  typeof criarParticipanteSchema
>;

export type atualizarParticipanteSchema =
  z.infer<typeof atualizarParticipanteSchema>;