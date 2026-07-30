import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { alterarStatusSchema } from '../schemas/status.schema';
import StatusService from '../services/StatusService';

class StatusController {
  private statusService = new StatusService();

  atualizarStatus = async(req: Request, res: Response): Promise<Response> => {
      const estudoId = Number(req.params.estudoId);
      const statusValidado = alterarStatusSchema.parse(req.body);
      const status = await this.statusService.alterarStatus(req.usuarioLogado.id, estudoId, statusValidado);
      return sendSuccess(
        res,
        {
          data: status,
          message: 'Status do estudo atualizado com sucesso!'
        },
        HttpStatus.OK
      );
    }
  
}
export default new StatusController();