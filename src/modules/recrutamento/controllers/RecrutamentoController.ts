import { StatusCandidato } from '@prisma/client';
import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import {
  atualizarCandidatoSchema,
  inscricaoPublicaSchema,
  salvarFormularioRecrutamentoSchema,
} from '../schemas/recrutamento.schema';
import RecrutamentoService from '../services/RecrutamentoService';

class RecrutamentoController {
  private recrutamentoService = new RecrutamentoService();

  obterFormulario = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.recrutamentoService.obterFormularioEstudo(req.usuarioLogado.id, estudoId);
    return sendSuccess(res, { data, message: 'Formulário de recrutamento consultado!' }, HttpStatus.OK);
  };

  salvarFormulario = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const dados = salvarFormularioRecrutamentoSchema.parse(req.body);
    const data = await this.recrutamentoService.salvarFormulario(req.usuarioLogado.id, estudoId, dados);
    return sendSuccess(
      res,
      { data, message: 'Formulário de recrutamento salvo com sucesso!' },
      HttpStatus.OK
    );
  };

  regenerarToken = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const data = await this.recrutamentoService.regenerarToken(req.usuarioLogado.id, estudoId);
    return sendSuccess(res, { data, message: 'Link público regenerado com sucesso!' }, HttpStatus.OK);
  };

  obterPublico = async (req: Request, res: Response): Promise<Response> => {
    const tokenPublico = String(req.params.tokenPublico);
    const data = await this.recrutamentoService.obterFormularioPublico(tokenPublico);
    return sendSuccess(res, { data, message: 'Formulário carregado com sucesso!' }, HttpStatus.OK);
  };

  inscreverPublico = async (req: Request, res: Response): Promise<Response> => {
    const tokenPublico = String(req.params.tokenPublico);
    const dados = inscricaoPublicaSchema.parse(req.body);
    const data = await this.recrutamentoService.registrarInscricaoPublica(tokenPublico, dados);
    return sendSuccess(
      res,
      { data, message: 'Inscrição enviada com sucesso! A equipe entrará em contato.' },
      HttpStatus.CREATED
    );
  };

  listarCandidatos = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status =
      rawStatus && Object.values(StatusCandidato).includes(rawStatus as StatusCandidato)
        ? (rawStatus as StatusCandidato)
        : undefined;
    const data = await this.recrutamentoService.listarCandidatos(
      req.usuarioLogado.id,
      estudoId,
      status
    );
    return sendSuccess(res, { data, message: 'Candidatos listados com sucesso!' }, HttpStatus.OK);
  };

  atualizarCandidato = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const candidatoId = Number(req.params.candidatoId);
    const dados = atualizarCandidatoSchema.parse(req.body);
    const data = await this.recrutamentoService.atualizarCandidato(
      req.usuarioLogado.id,
      estudoId,
      candidatoId,
      dados
    );
    return sendSuccess(res, { data, message: 'Candidato atualizado com sucesso!' }, HttpStatus.OK);
  };

  converterCandidato = async (req: Request, res: Response): Promise<Response> => {
    const estudoId = Number(req.params.estudoId);
    const candidatoId = Number(req.params.candidatoId);
    const data = await this.recrutamentoService.converterEmParticipante(
      req.usuarioLogado.id,
      estudoId,
      candidatoId
    );
    return sendSuccess(
      res,
      { data, message: 'Candidato convertido em participante do estudo com sucesso!' },
      HttpStatus.CREATED
    );
  };
}

export default new RecrutamentoController();
