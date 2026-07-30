import { z } from 'zod';

export const alterarStatusSchema = z.object({
    status: z.enum([
        "PLANEJAMENTO",
        "EM_ANDAMENTO",
        "COLETA_ENCERRADA",
        "ARQUIVADO"
    ])
});

export type AlterarStatusInput =
    z.infer<typeof alterarStatusSchema>;