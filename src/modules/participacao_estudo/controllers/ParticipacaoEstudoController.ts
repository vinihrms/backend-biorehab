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
    const participacoes = await this.participacaoEstudoService.listar(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: participacoes,
        message: 'Participações do estudo listados com sucesso!'
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
        message: 'Participações do estudo criada com sucesso!'
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

  listarExcluidos = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const participantes = await this.participacaoEstudoService.listarExcluidos(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: participantes,
        message: 'Participações excluidos listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  restaurar = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const participanteId = Number(req.params.participanteId)
    const participacao = await this.participacaoEstudoService.restaurar(req.usuarioLogado.id, estudoId, participanteId);
    return sendSuccess(
      res,
      {
        data: participacao,
        message: 'Participação restaurada com sucesso!'
      },
      HttpStatus.OK
    );
  }

  buscaParticipacao= async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const participanteId = Number(req.params.participanteId)
    const participantes = await this.participacaoEstudoService.listarPorEstudoEParticipanteId(req.usuarioLogado.id, estudoId, participanteId);
    return sendSuccess(
      res,
      {
        data: participantes,
        message: 'Participação do estudo listada com sucesso!'
      },
      HttpStatus.OK
    );
  }

}

export default new ParticipacaoEstudoController();