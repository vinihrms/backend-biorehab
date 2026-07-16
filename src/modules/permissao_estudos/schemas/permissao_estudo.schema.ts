import { z } from 'zod';
import { Papel } from '@prisma/client';

export const criarPermissaoEstudoSchema = z.object({
  usuarioId: z.number().int().positive(),
  papel: z.nativeEnum(Papel),
});

export const atualizarPermissaoEstudoSchema = z.object({
  papel: z.nativeEnum(Papel),
});


export type CriarPermissaoEstudoInput =
  z.infer<typeof criarPermissaoEstudoSchema>;

export type AtualizarPermissaoEstudoInput =
  z.infer<typeof atualizarPermissaoEstudoSchema>;