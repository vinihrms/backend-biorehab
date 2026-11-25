import type { Request, Response } from 'express';
import { exportarEstudoSchema } from '../schemas/export.schema';
import ExportService from '../services/ExportService';

class ExportController {
  private exportService = new ExportService();

  exportar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = exportarEstudoSchema.parse(req.body);

    const resultado = await this.exportService.exportar(req.usuarioLogado.id, estudoId, dados);

    res.setHeader('Content-Type', resultado.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);

    return res.send(resultado.content);
  };
}

export default new ExportController();
