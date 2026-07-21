import { atualizarTipoVisita, criarTipoVisita } from './../schemas/tipos_visita.schema';
import { Participante } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import ParticipanteService from '../services/TiposVisitaService';
import TiposVisitaService from '../services/TiposVisitaService';

class TiposVisitaController {
  private tiposVisitaService = new TiposVisitaService();

  listarPorEstudo = async (req: Request, res: Response): Promise<Response> => {
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

  criaTipoDeVisita = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const dadosValidados = criarTipoVisita.parse(req.body)

    const tipoDeVista = await this.tiposVisitaService.criaTipoDeVisita(req.usuarioLogado.id, estudoId, dadosValidados);
    return sendSuccess(
      res,
      {
        data: tipoDeVista,
        message: 'Tipo de visita criada com sucesso!'
      },
      HttpStatus.CREATED
    );
  }

  getVisitaById = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tipoVisitaId = Number(req.params.tipoVisitaId)
    const tipoVisita = await this.tiposVisitaService.buscaPorId(req.usuarioLogado.id, estudoId, tipoVisitaId);
    return sendSuccess(
      res,
      {
        data: tipoVisita,
        message: 'Tipos de visita listado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  atualiza = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tipoVisitaId = Number(req.params.tipoVisitaId)
    const dadosValidados = atualizarTipoVisita.parse(req.body)

    const tipoVisita = await this.tiposVisitaService.atualizar(req.usuarioLogado.id, estudoId, dadosValidados, tipoVisitaId);
    return sendSuccess(
      res,
      {
        data: tipoVisita,
        message: 'Tipo de visita atualizado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  apagar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tipoVisitaId = Number(req.params.tipoVisitaId)

    const tipoVisitaDeletado = await this.tiposVisitaService.apaga(req.usuarioLogado.id, estudoId, tipoVisitaId);
    return sendSuccess(
      res,
      {
        data: tipoVisitaDeletado,
        message: 'Tipo de visita deletado com sucesso!'
      },
      HttpStatus.OK
    );
  }

  buscaExcluidos = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tipoVisita = await this.tiposVisitaService.buscaExcluidos(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: tipoVisita,
        message: 'Tipos de visita exluídos listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

  restaura = async(req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const tipoVisitaId = Number(req.params.tipoVisitaId)
    const tipoVisita = await this.tiposVisitaService.restaura(req.usuarioLogado.id, estudoId, tipoVisitaId);
    return sendSuccess(
      res,
      {
        data: tipoVisita,
        message: 'Tipo de visita restaurado com sucesso!'
      },
      HttpStatus.OK
    );
  }

}

export default new TiposVisitaController();