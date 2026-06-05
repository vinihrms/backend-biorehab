  import type { Request, Response } from 'express';
  import { HttpStatus } from '../../../utils/http-status';
  import { sendSuccess } from '../../../utils/response';
  import EstudoService from '../services/EstudoService';
  import { criarEstudoSchema } from '../schemas/estudo.schema';

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

  }

  export default new EstudoController();