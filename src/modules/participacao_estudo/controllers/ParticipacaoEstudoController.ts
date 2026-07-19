import { Participante, ParticipacaoEstudo } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { atualizarParticipacaoEstudo, criarParticipacaoEstudo } from '../schemas/participacao_estudo.schema';
import ParticipanteEstudoService from '../services/ParticipacaoEstudoService';

class ParticipacaoEstudoController {

  private participacaoEstudoService = new ParticipanteEstudoService();

  listarPorEstudo = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const participantes = await this.participacaoEstudoService.listar(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: participantes,
        message: 'Participantes do estudo listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  vincularAoEstudo = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const dadosValidados = criarParticipacaoEstudo.parse(req.body)

    const participacaoEstudo = await this.participacaoEstudoService.vincularAoEstudo(req.usuarioLogado.id, estudoId, dadosValidados);
    return sendSuccess(
      res,
      {
        data: participacaoEstudo,
        message: 'Participante vinculado ao estudo com sucesso!'
      },
      HttpStatus.CREATED
    );
  }

  desvinculaAoEstudo = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const participanteId = Number(req.params.participanteId);

    const participacaoRemovida = await this.participacaoEstudoService.desvincularAoEstudo(req.usuarioLogado.id, estudoId, participanteId);
    return sendSuccess(
      res,
      {
        data: participacaoRemovida,
        message: 'Participante desvinculado ao estudo com sucesso!'
      },
      HttpStatus.OK
    );
  }

}

export default new ParticipacaoEstudoController();