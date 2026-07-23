import type { Request, Response } from "express";

import ExportService from "../services/ExportService";

import { exportarEstudoSchema } from "../schemas/export.schema";

class ExportController {

    private exportService = new ExportService();

    exportar = async (req: Request, res: Response): Promise<Response> => {

        const estudoId = Number(req.params.estudoId);

        const dados = exportarEstudoSchema.parse(req.body);

        const csv = await this.exportService.exportar(req.usuarioLogado.id, estudoId, dados);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");

        res.setHeader("Content-Disposition",`attachment; filename="estudo-${estudoId}.csv"`);

        return res.send(csv);
    };
}

export default new ExportController();