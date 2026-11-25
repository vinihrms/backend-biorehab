import { z } from 'zod';

export const exportarEstudoSchema = z.object({
  formato: z.enum(['csv', 'xlsx']),
  layout: z.enum(['long', 'wide']).optional().default('long'),
  separadorCsv: z.enum([';', ',']).optional().default(';'),
  formatoMultiEscolha: z.enum(['concatenado', 'binario']).optional().default('concatenado'),
  incluirParticipantes: z.boolean(),
  incluirGrupo: z.boolean().optional().default(true),
  incluirVisitas: z.array(z.number()),
  incluirVariaveis: z.array(z.number()),
});

export type ExportarEstudoInput = z.infer<typeof exportarEstudoSchema>;

export interface LinhaExportacao {
  [coluna: string]: string | number | Date | null;
}
