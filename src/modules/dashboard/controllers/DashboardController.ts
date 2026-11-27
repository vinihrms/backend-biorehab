import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import DashboardService from '../services/DashboardService';

class DashboardController {
  private dashboardService = new DashboardService();

  obter = async (req: Request, res: Response): Promise<Response> => {
    const dashboard = await this.dashboardService.obterResumo(req.usuarioLogado.id);

    return sendSuccess(
      res,
      {
        data: dashboard,
        message: 'Dashboard carregado com sucesso!',
      },
      HttpStatus.OK
    );
  };
}

export default new DashboardController();
