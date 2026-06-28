import { Estudo } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import EstudoService from '../services/EstudoService';
import { atualizarEstudoSchema, criarEstudoSchema } from '../schemas/estudo.schema';

class EstudoController {
  private estudoService = new EstudoService();

  criar = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = criarEstudoSchema.parse(req.body)

    const estudo = await this.estudoService.create(dadosValidados, req.usuarioLogado.id);

    return sendSuccess(
      res,
      {
        data: estudo,
        message: 'Estudo criado com sucesso!'
      },
      HttpStatus.CREATED
    );
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const estudos = await this.estudoService.list(req.usuarioLogado.id);
    return sendSuccess(
      res,
      {
        data: estudos,
        message: 'Estudos listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  buscarPorId = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.id)

    const estudo = await this.estudoService.getById(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: estudo,
        message: 'Estudo listado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  atualizar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.id)
    const dadosValidados = atualizarEstudoSchema.parse(req.body)


    const estudo = await this.estudoService.atualizarEstudo(req.usuarioLogado.id, estudoId, dadosValidados);
    return sendSuccess(
      res,
      {
        data: estudo,
        message: 'Estudo listado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  deletar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.id)
    const estudo = await this.estudoService.deletarEstudo(req.usuarioLogado.id, estudoId);

    return sendSuccess(
      res,
      {
        data: estudo,
        message: 'Estudo atualizado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  

}
export default new EstudoController();