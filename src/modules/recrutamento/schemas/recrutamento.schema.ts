import { Sexo, StatusCandidato } from '@prisma/client';
import { z } from 'zod';

const telefoneOpcionalSchema = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : val),
  z
    .string()
    .max(20)
    .regex(/^\d{10,15}$/, 'Telefone deve conter entre 10 e 15 dígitos numéricos.')
    .nullable()
    .optional()
);

const emailOpcionalSchema = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : val),
  z.string().email('Email inválido.').max(254).nullable().optional()
);

export const campoTriagemSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(2).max(200),
  tipo: z.enum(['text', 'numeric', 'boolean', 'choice', 'multi_choice']),
  obrigatorio: z.boolean().default(false),
  opcoes: z.array(z.string().min(1).max(200)).optional(),
});

export const salvarFormularioRecrutamentoSchema = z.object({
  ativo: z.boolean().optional().default(true),
  titulo: z.string().min(3).max(150),
  descricao: z.string().max(4000).nullable().optional(),
  camposTriagem: z.array(campoTriagemSchema).optional().default([]),
});

export const inscricaoPublicaSchema = z.object({
  nome: z.string().min(3).max(150),
  telefone: telefoneOpcionalSchema,
  email: emailOpcionalSchema,
  sexo: z.nativeEnum(Sexo),
  nascimento: z.coerce.date(),
  respostasTriagem: z.record(z.string(), z.unknown()).optional().default({}),
});

export const atualizarCandidatoSchema = z.object({
  status: z.nativeEnum(StatusCandidato).optional(),
  notasContato: z.string().max(2000).nullable().optional(),
});

export type CampoTriagem = z.infer<typeof campoTriagemSchema>;
export type SalvarFormularioRecrutamentoInput = z.infer<typeof salvarFormularioRecrutamentoSchema>;
export type InscricaoPublicaInput = z.infer<typeof inscricaoPublicaSchema>;
export type AtualizarCandidatoInput = z.infer<typeof atualizarCandidatoSchema>;
