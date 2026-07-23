import { z } from "zod";

export const exportarEstudoSchema = z.object({
    formato: z.enum(["csv", "xlsx"]),
    incluirParticipantes: z.boolean(),
    incluirVisitas: z.array(z.number()),
    incluirVariaveis: z.array(z.number())
});

export type ExportarEstudoInput = z.infer<typeof exportarEstudoSchema>;

export interface LinhaExportacao {
    [coluna: string]: string | number | Date | null;
}