import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import VariavelService from '../services/VariavelService';
import { atualizarVariavelSchema, criarVariavelSchema } from '../schemas/variavel.schema';

class VariavelController {
  private variavelService = new VariavelService();

  listar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const variaveis = await this.variavelService.listaVariaveis(estudoId, req.usuarioLogado.id);
    return sendSuccess(
      res,
      {
        data: variaveis,
        message: 'Variaveis listadas com sucesso!'
      },
      HttpStatus.OK
    );
  }
  
  listarPorId = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const variavelId = Number(req.params.variavelId);
    const variaveis = await this.variavelService.listaVariaveisPorId(estudoId, variavelId, req.usuarioLogado.id);
    return sendSuccess(
      res,
      {
        data: variaveis,
        message: 'Variável listada com sucesso!'
      },
      HttpStatus.OK
    );
  }

  criar = async (req: Request, res: Response): Promise<Response> => {
      const dadosValidados = criarVariavelSchema.parse(req.body)
      const estudoId = Number(req.params.estudoId)
      const variavel = await this.variavelService.criar(dadosValidados, req.usuarioLogado.id, estudoId);
  
      return sendSuccess(
        res,
        {
          data: variavel,
          message: 'Variável criada com sucesso!'
        },
        HttpStatus.CREATED
      );
    };

    atualizar = async (req: Request, res: Response): Promise<Response> => {
        const estudoId = Number(req.params.estudoId)
        const dadosValidados = atualizarVariavelSchema.parse(req.body)
        const variavelId = Number(req.params.variavelId)
        const variavel = await this.variavelService.atualizar(req.usuarioLogado.id, estudoId, variavelId, dadosValidados);
        return sendSuccess(
          res,
          {
            data: variavel,
            message: 'Variável atualizada com sucesso!'
          },
          HttpStatus.OK
        );
      }

    deletar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const variavelId = Number(req.params.variavelId)
    await this.variavelService.deletar(req.usuarioLogado.id, variavelId, estudoId);

    return sendSuccess(
      res,
      {
        data: null,
        message: 'Estudo deletado com sucesso!'
      },
      HttpStatus.OK
    );
  }


  listarExcluidas = async (req: Request, res: Response): Promise<Response> => {

    const estudoId = Number(req.params.estudoId);


    const variaveis = await this.variavelService.buscarExcluidos(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      {
        data: variaveis,
        message: 'Variáveis deletados listados com sucesso!'
      },
      HttpStatus.OK
    );
  }

}
export default new VariavelController();