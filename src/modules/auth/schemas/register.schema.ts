import { z } from 'zod';

export const cadastrarUsuarioSchema = z.object({
  email: z.string().email('Email invalido.').max(254),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.').max(255),
  ra: z.string().length(6, 'RA deve conter exatamente 6 caracteres.'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(150),
});

export type CadastrarUsuarioInput = z.infer<typeof cadastrarUsuarioSchema>;