import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import {
  alocarEmLoteSchema,
  alocarParticipanteSchema,
  atualizarGrupoEstudoSchema,
  atualizarIntervencaoSchema,
  criarGrupoEstudoSchema,
  criarIntervencaoSchema,
  quebraEmergencialSchema,
} from '../schemas/cegamento.schema';
import CegamentoService from '../services/CegamentoService';

class CegamentoController {
  private cegamentoService = new CegamentoService();

  listarGrupos = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.cegamentoService.listarGrupos(req.usuarioLogado.id, estudoId);
    return sendSuccess(res, { data, message: 'Grupos listados com sucesso!' }, HttpStatus.OK);
  };

  criarGrupo = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = criarGrupoEstudoSchema.parse(req.body);
    const data = await this.cegamentoService.criarGrupo(req.usuarioLogado.id, estudoId, dados);
    return sendSuccess(res, { data, message: 'Grupo criado com sucesso!' }, HttpStatus.CREATED);
  };

  atualizarGrupo = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const grupoId = Number(req.params.grupoId);
    const dados = atualizarGrupoEstudoSchema.parse(req.body);
    const data = await this.cegamentoService.atualizarGrupo(
      req.usuarioLogado.id,
      estudoId,
      grupoId,
      dados
    );
    return sendSuccess(res, { data, message: 'Grupo atualizado com sucesso!' }, HttpStatus.OK);
  };

  deletarGrupo = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const grupoId = Number(req.params.grupoId);
    await this.cegamentoService.deletarGrupo(req.usuarioLogado.id, estudoId, grupoId);
    return sendSuccess(res, { data: null, message: 'Grupo removido com sucesso!' }, HttpStatus.OK);
  };

  listarAlocacoes = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.cegamentoService.listarAlocacoes(req.usuarioLogado.id, estudoId);
    return sendSuccess(res, { data, message: 'Alocações consultadas com sucesso!' }, HttpStatus.OK);
  };

  alocarParticipante = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = alocarParticipanteSchema.parse(req.body);
    const data = await this.cegamentoService.alocarParticipante(req.usuarioLogado.id, estudoId, dados);
    return sendSuccess(res, { data, message: 'Voluntário alocado ao grupo com sucesso!' }, HttpStatus.CREATED);
  };

  alocarEmLote = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = alocarEmLoteSchema.parse(req.body);
    const data = await this.cegamentoService.alocarEmLote(req.usuarioLogado.id, estudoId, dados);
    return sendSuccess(res, { data, message: 'Alocações em lote registradas com sucesso!' }, HttpStatus.CREATED);
  };

  revelarCegamento = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.cegamentoService.revelarCegamentoEstudo(req.usuarioLogado.id, estudoId);
    return sendSuccess(
      res,
      { data, message: 'Cegamento do estudo revelado com sucesso!' },
      HttpStatus.OK
    );
  };

  quebraEmergencial = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const participacaoId = Number(req.params.participacaoId);
    const dados = quebraEmergencialSchema.parse(req.body);
    const data = await this.cegamentoService.quebraEmergencialIndividual(
      req.usuarioLogado.id,
      estudoId,
      participacaoId,
      dados
    );
    return sendSuccess(
      res,
      { data, message: 'Quebra emergencial individual registrada com sucesso!' },
      HttpStatus.OK
    );
  };

  listarIntervencoes = async (req: Request, res: Response): Promise<Response> => {
    const participacaoId = Number(req.params.participacaoId);
    const data = await this.cegamentoService.listarIntervencoes(req.usuarioLogado.id, participacaoId);
    return sendSuccess(res, { data, message: 'Intervenções listadas com sucesso!' }, HttpStatus.OK);
  };

  criarIntervencao = async (req: Request, res: Response): Promise<Response> => {
    const participacaoId = Number(req.params.participacaoId);
    const dados = criarIntervencaoSchema.parse(req.body);
    const data = await this.cegamentoService.criarIntervencao(
      req.usuarioLogado.id,
      participacaoId,
      dados
    );
    return sendSuccess(
      res,
      { data, message: 'Intervenção registrada com sucesso!' },
      HttpStatus.CREATED
    );
  };

  atualizarIntervencao = async (req: Request, res: Response): Promise<Response> => {
    const participacaoId = Number(req.params.participacaoId);
    const intervencaoId = Number(req.params.intervencaoId);
    const dados = atualizarIntervencaoSchema.parse(req.body);
    const data = await this.cegamentoService.atualizarIntervencao(
      req.usuarioLogado.id,
      participacaoId,
      intervencaoId,
      dados
    );
    return sendSuccess(res, { data, message: 'Intervenção atualizada com sucesso!' }, HttpStatus.OK);
  };

  deletarIntervencao = async (req: Request, res: Response): Promise<Response> => {
    const participacaoId = Number(req.params.participacaoId);
    const intervencaoId = Number(req.params.intervencaoId);
    await this.cegamentoService.deletarIntervencao(
      req.usuarioLogado.id,
      participacaoId,
      intervencaoId
    );
    return sendSuccess(res, { data: null, message: 'Intervenção removida com sucesso!' }, HttpStatus.OK);
  };
}

export default new CegamentoController();
