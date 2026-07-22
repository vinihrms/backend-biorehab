import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import VisitaService from '../services/VisitaService';
import { atualizarVisitaSchema, criarVisitaSchema } from '../schemas/visita.schema';

class VisitaController {
    private visitaService = new VisitaService();

    listar = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitas = await this.visitaService.listar(req.usuarioLogado.id, participacaoId);
        return sendSuccess(
            res,
            {
                data: visitas,
                message: 'Visitas listadas com sucesso!'
            },
            HttpStatus.OK
        );
    }

    listarExcluidas = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitasExcluidas = await this.visitaService.listarExcluidas(req.usuarioLogado.id, participacaoId);
        return sendSuccess(
            res,
            {
                data: visitasExcluidas,
                message: 'Visitas excluídas listadas com sucesso!'
            },
            HttpStatus.OK
        );
    }

    buscarPorId = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitaId = Number(req.params.visitaId);
        const visita = await this.visitaService.buscarPorId(req.usuarioLogado.id, participacaoId, visitaId);
        return sendSuccess(
            res,
            {
                data: visita,
                message: 'Visita encontrada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    criar = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const dadosValidados = criarVisitaSchema.parse(req.body)
        const visita = await this.visitaService.criar(req.usuarioLogado.id, participacaoId, dadosValidados);
        return sendSuccess(
            res,
            {
                data: visita,
                message: 'Visita criada com sucesso!'
            },
            HttpStatus.CREATED
        );
    }

    atualizar = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitaId = Number(req.params.visitaId);
        const dadosValidados = atualizarVisitaSchema.parse(req.body)
        const visita = await this.visitaService.atualizar(req.usuarioLogado.id, participacaoId, visitaId, dadosValidados);
        return sendSuccess(
            res,
            {
                data: visita,
                message: 'Visita atualizada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    deletar = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitaId = Number(req.params.visitaId);
        const visita = await this.visitaService.deletar(req.usuarioLogado.id, participacaoId, visitaId);
        return sendSuccess(
            res,
            {
                data: visita,
                message: 'Visita deletada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    restaurar = async (req: Request, res: Response): Promise<Response> => {
        const participacaoId = Number(req.params.participacaoId);
        const visitaId = Number(req.params.visitaId);
        const visita = await this.visitaService.restaurar(req.usuarioLogado.id, participacaoId, visitaId);
        return sendSuccess(
            res,
            {
                data: visita,
                message: 'Visita restaurada com sucesso!'
            },
            HttpStatus.OK
        );
    }



}
export default new VisitaController();