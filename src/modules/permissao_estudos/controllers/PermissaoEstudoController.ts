import { Estudo } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import EstudoService from '../services/PermissaoEstudoService';
import PermissaoEstudoService from '../services/PermissaoEstudoService';
import { atualizarPermissaoEstudoSchema, criarPermissaoEstudoSchema } from '../schemas/permissao_estudo.schema';
import { atualizarParticipanteSchema } from '../../participantes/schemas/participante.schema';

class PermissaoEstudoController {
  private permissoesEstudoService = new PermissaoEstudoService();

  listar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const permissoes = await this.permissoesEstudoService.listaTodas(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: permissoes,
        message: 'Permissoes listadas com sucesso!'
      },
      HttpStatus.OK
    );
  }

  criar = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = criarPermissaoEstudoSchema.parse(req.body)
    const estudoId = Number(req.params.estudoId)

    const permissao = await this.permissoesEstudoService.create(estudoId, dadosValidados, req.usuarioLogado.id);

    return sendSuccess(
      res,
      {
        data: permissao,
        message: 'Permissão criada com sucesso!'
      },
      HttpStatus.CREATED
    );
  };

  atualizar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const dadosValidados = atualizarPermissaoEstudoSchema.parse(req.body)
    const usuarioId = Number(req.params.usuarioId)


    const permissao = await this.permissoesEstudoService.atualizar(req.usuarioLogado.id, dadosValidados, estudoId, usuarioId);
    return sendSuccess(
      res,
      {
        data: permissao,
        message: 'Permissão atualizada com sucesso!'
      },
      HttpStatus.OK
    );
  }

  // sem soft delete pq nao precisa
  deletar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId)
    const usuarioId = Number(req.params.usuarioId)
    await this.permissoesEstudoService.deletar(req.usuarioLogado.id, estudoId, usuarioId);

    return sendSuccess(
      res,
      {
        data: null,
        message: 'Permissão removida com sucesso!'
      },
      HttpStatus.OK
    );
  }


  
}
export default new PermissaoEstudoController();