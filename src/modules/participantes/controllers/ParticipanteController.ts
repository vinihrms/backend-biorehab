import { Participante } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { atualizarParticipanteSchema, criarParticipanteSchema } from '../schemas/participante.schema';
import ParticipanteService from '../services/ParticipanteService';

class ParticipanteController {
    private participanteService = new ParticipanteService();
    
    criar = async (req: Request, res: Response): Promise<Response> => {
        const dadosValidados = criarParticipanteSchema.parse(req.body)
    
        const participante = await this.participanteService.create(dadosValidados, req.usuarioLogado.id);
    
        return sendSuccess(
          res,
          {
            data: participante,
            message: 'Participante cadastrado com sucesso!'
          },
          HttpStatus.CREATED
        );
      };

    listar = async (req: Request, res: Response): Promise<Response> => {
    const participantes = await this.participanteService.listar();
    return sendSuccess(
      res,
      {
        data: participantes,
        message: 'Participantes listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  buscaPorId = async (req: Request, res: Response): Promise<Response> => {
    const participanteId = Number(req.params.participanteId)

    const participante = await this.participanteService.getById(participanteId);
    return sendSuccess(
      res,
      {
        data: participante,
        message: 'Participante listado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  atualizar = async (req: Request, res: Response): Promise<Response> => {
      const participanteId = Number(req.params.participanteId)
      const dadosValidados = atualizarParticipanteSchema.parse(req.body)
  
      const participante = await this.participanteService.atualizar(participanteId, dadosValidados);
      return sendSuccess(
        res,
        {
          data: participante,
          message: 'Participante atualizado com sucesso!'
        },
        HttpStatus.OK
      );
    }

    deletar = async (req: Request, res: Response): Promise<Response> => {
    const participanteId = Number(req.params.participanteId)
    await this.participanteService.deletar(participanteId);

    return sendSuccess(
      res,
      {
        data: null,
        message: 'Participante deletado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  listarExcluidos = async (req: Request, res: Response): Promise<Response> => {
    const participantes = await this.participanteService.buscarExcluidos();
    return sendSuccess(
      res,
      {
        data: participantes,
        message: 'Participantes deletados listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  restaurar = async (req: Request, res: Response): Promise<Response> => {
    const participanteId = Number(req.params.participanteId)

    const participante = await this.participanteService.restaurar(participanteId);
    return sendSuccess(
      res,
      {
        data: participante,
        message: 'Participante restaurado com sucesso!'
      },
      HttpStatus.OK
    );
  }

}

export default new ParticipanteController();