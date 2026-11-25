import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import {
  atualizarCatalogoTipoVisitaSchema,
  atualizarCatalogoVariavelSchema,
  criarCatalogoTipoVisitaSchema,
  criarCatalogoVariavelSchema,
  importarTiposVisitaEstudoSchema,
  importarVariaveisEstudoSchema,
} from '../schemas/catalogo.schema';
import CatalogoService from '../services/CatalogoService';

class CatalogoController {
  private catalogoService = new CatalogoService();

  listarVariaveis = async (req: Request, res: Response): Promise<Response> => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await this.catalogoService.listarVariaveisCatalogo(q);
    return sendSuccess(res, { data, message: 'Catálogo de variáveis listado com sucesso!' }, HttpStatus.OK);
  };

  criarVariavel = async (req: Request, res: Response): Promise<Response> => {
    const dados = criarCatalogoVariavelSchema.parse(req.body);
    const data = await this.catalogoService.criarVariavelCatalogo(req.usuarioLogado.id, dados);
    return sendSuccess(res, { data, message: 'Variável adicionada ao catálogo!' }, HttpStatus.CREATED);
  };

  atualizarVariavel = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.catalogoId);
    const dados = atualizarCatalogoVariavelSchema.parse(req.body);
    const data = await this.catalogoService.atualizarVariavelCatalogo(req.usuarioLogado.id, id, dados);
    return sendSuccess(res, { data, message: 'Variável de catálogo atualizada!' }, HttpStatus.OK);
  };

  deletarVariavel = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.catalogoId);
    await this.catalogoService.deletarVariavelCatalogo(req.usuarioLogado.id, id);
    return sendSuccess(res, { data: null, message: 'Variável removida do catálogo!' }, HttpStatus.OK);
  };

  promoverVariavel = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const variavelId = Number(req.params.variavelId);
    const data = await this.catalogoService.promoverVariavelAoCatalogo(
      req.usuarioLogado.id,
      estudoId,
      variavelId
    );
    return sendSuccess(
      res,
      { data, message: 'Variável promovida ao catálogo oficial!' },
      HttpStatus.CREATED
    );
  };

  listarTiposVisita = async (req: Request, res: Response): Promise<Response> => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await this.catalogoService.listarTiposVisitaCatalogo(q);
    return sendSuccess(
      res,
      { data, message: 'Catálogo de tipos de visita listado com sucesso!' },
      HttpStatus.OK
    );
  };

  criarTipoVisita = async (req: Request, res: Response): Promise<Response> => {
    const dados = criarCatalogoTipoVisitaSchema.parse(req.body);
    const data = await this.catalogoService.criarTipoVisitaCatalogo(req.usuarioLogado.id, dados);
    return sendSuccess(res, { data, message: 'Tipo de visita adicionado ao catálogo!' }, HttpStatus.CREATED);
  };

  atualizarTipoVisita = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.catalogoId);
    const dados = atualizarCatalogoTipoVisitaSchema.parse(req.body);
    const data = await this.catalogoService.atualizarTipoVisitaCatalogo(req.usuarioLogado.id, id, dados);
    return sendSuccess(res, { data, message: 'Tipo de visita de catálogo atualizado!' }, HttpStatus.OK);
  };

  deletarTipoVisita = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.catalogoId);
    await this.catalogoService.deletarTipoVisitaCatalogo(req.usuarioLogado.id, id);
    return sendSuccess(res, { data: null, message: 'Tipo de visita removido do catálogo!' }, HttpStatus.OK);
  };

  importarVariaveisParaEstudo = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = importarVariaveisEstudoSchema.parse(req.body);
    const data = await this.catalogoService.importarVariaveisParaEstudo(
      req.usuarioLogado.id,
      estudoId,
      dados
    );
    return sendSuccess(res, { data, message: 'Importação de variáveis concluída!' }, HttpStatus.CREATED);
  };

  importarTiposVisitaParaEstudo = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = importarTiposVisitaEstudoSchema.parse(req.body);
    const data = await this.catalogoService.importarTiposVisitaParaEstudo(
      req.usuarioLogado.id,
      estudoId,
      dados
    );
    return sendSuccess(
      res,
      { data, message: 'Importação de tipos de visita concluída!' },
      HttpStatus.CREATED
    );
  };
}

export default new CatalogoController();
