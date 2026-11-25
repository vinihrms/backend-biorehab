import { Sexo } from '@prisma/client';
import { z } from 'zod';

const telefoneOpcionalSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) {
      return null;
    }
    return val;
  },
  z
    .string()
    .max(20)
    .regex(/^\d{10,15}$/, 'Telefone deve conter entre 10 e 15 dígitos numéricos.')
    .nullable()
    .optional()
);

export const criarParticipanteSchema = z.object({
  nome: z.string().min(3).max(150),
  telefone: telefoneOpcionalSchema,
  sexo: z.nativeEnum(Sexo),
  nascimento: z.coerce.date(),
});

export const atualizarParticipanteSchema = criarParticipanteSchema.partial();

export type CriarParticipanteInput = z.infer<typeof criarParticipanteSchema>;

export type atualizarParticipanteSchema = z.infer<typeof atualizarParticipanteSchema>;
