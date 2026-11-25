import type { Request, Response } from 'express';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { executarImportacaoSchema } from '../schemas/importacao.schema';
import ImportacaoService from '../services/ImportacaoService';

class ImportacaoController {
  private importacaoService = new ImportacaoService();

  analisar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    if (!req.file) {
      throw new AppError(
        'FILE_REQUIRED',
        'Envie a planilha no campo multipart "arquivo".',
        HttpStatus.BAD_REQUEST
      );
    }

    const data = await this.importacaoService.analisarArquivo(
      req.usuarioLogado.id,
      estudoId,
      req.file
    );

    return sendSuccess(
      res,
      { data, message: 'Planilha analisada com sucesso! Prossiga para o mapeamento.' },
      HttpStatus.OK
    );
  };

  validar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = executarImportacaoSchema.parse(req.body);
    const data = await this.importacaoService.validar(req.usuarioLogado.id, estudoId, dados);

    return sendSuccess(res, { data, message: 'Validação concluída!' }, HttpStatus.OK);
  };

  confirmar = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = executarImportacaoSchema.parse(req.body);
    const data = await this.importacaoService.confirmar(req.usuarioLogado.id, estudoId, dados);

    return sendSuccess(
      res,
      { data, message: 'Importação concluída e registrada com sucesso!' },
      HttpStatus.CREATED
    );
  };

  listarLogs = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.importacaoService.listarLogs(req.usuarioLogado.id, estudoId);

    return sendSuccess(res, { data, message: 'Histórico de importações listado!' }, HttpStatus.OK);
  };
}

export default new ImportacaoController();
