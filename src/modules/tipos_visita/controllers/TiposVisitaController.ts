import { Participante } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { atualizarParticipanteSchema, criarParticipanteSchema } from '../schemas/tipos_visita.schema';
import ParticipanteService from '../services/TiposVisitaService';
import TiposVisitaService from '../services/TiposVisitaService';

class TiposVisitaController {
  private tiposVisitaService = new TiposVisitaService();

  listarPorEstudo = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tiposVisita = await this.tiposVisitaService.listaPorEstudo(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: tiposVisita,
        message: 'Tipos de visita deste estudo listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

}

export default new TiposVisitaController();