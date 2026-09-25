import { z } from 'zod';

export const atualizarUsuarioSchema = z.object({
  email: z.string().email('Email invalido.').max(254).optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.').max(255).optional(),
  ra: z.string().length(6, 'RA deve conter exatamente 6 caracteres.').optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(150).optional(),
  isActive: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;