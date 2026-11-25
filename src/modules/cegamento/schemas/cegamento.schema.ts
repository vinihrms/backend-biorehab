import { z } from 'zod';

export const criarGrupoEstudoSchema = z.object({
  nome: z.string().min(2).max(100),
  descricaoMetodo: z.string().max(4000).nullable().optional(),
});

export const atualizarGrupoEstudoSchema = criarGrupoEstudoSchema.partial();

export const alocarParticipanteSchema = z.object({
  participacaoEstudoId: z.number().int().positive(),
  grupoEstudoId: z.number().int().positive(),
  observacoes: z.string().max(1000).nullable().optional(),
});

export const alocarEmLoteSchema = z.object({
  alocacoes: z.array(alocarParticipanteSchema).min(1),
});

export const quebraEmergencialSchema = z.object({
  motivo: z.string().min(5, 'Informe uma justificativa com pelo menos 5 caracteres.').max(1000),
});

export const criarIntervencaoSchema = z.object({
  data: z.coerce.date(),
  notas: z.string().max(2000).nullable().optional(),
});

export const atualizarIntervencaoSchema = criarIntervencaoSchema.partial();

export type CriarGrupoEstudoInput = z.infer<typeof criarGrupoEstudoSchema>;
export type AtualizarGrupoEstudoInput = z.infer<typeof atualizarGrupoEstudoSchema>;
export type AlocarParticipanteInput = z.infer<typeof alocarParticipanteSchema>;
export type AlocarEmLoteInput = z.infer<typeof alocarEmLoteSchema>;
export type QuebraEmergencialInput = z.infer<typeof quebraEmergencialSchema>;
export type CriarIntervencaoInput = z.infer<typeof criarIntervencaoSchema>;
export type AtualizarIntervencaoInput = z.infer<typeof atualizarIntervencaoSchema>;
