import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import MedicaoService from '../services/MedicaoService';
import { atualizarMedicaoSchema, criarMedicaoSchema } from '../schemas/medicao.schema';

class MedicaoController {

    private medicaoService = new MedicaoService();

    listar = async (req: Request, res: Response): Promise<Response> => {
        const visitaId = Number(req.params.visitaId);
        const medicoes = await this.medicaoService.listar(req.usuarioLogado.id, visitaId);
        return sendSuccess(
            res,
            {
                data: medicoes,
                message: 'Medições listadas com sucesso!'
            },
            HttpStatus.OK
        );
    }

    listarExcluidas = async (req: Request, res: Response): Promise<Response> => {
        const visitaId = Number(req.params.visitaId);
        const medicoesExcluidas = await this.medicaoService.listarExcluidas(req.usuarioLogado.id, visitaId);
        return sendSuccess(
            res,
            {
                data: medicoesExcluidas,
                message: 'Medições excluidas listadas com sucesso!'
            },
            HttpStatus.OK
        );
    }

    buscarPorId = async (req: Request, res: Response): Promise<Response> => {
        const visitaId = Number(req.params.visitaId);
        const medicaoId = Number(req.params.medicaoId);
        const medicao = await this.medicaoService.buscarPorId(req.usuarioLogado.id, visitaId, medicaoId);
        return sendSuccess(
            res,
            {
                data: medicao,
                message: 'Medição listada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    criar = async (req: Request, res: Response): Promise<Response> => {
        const dadosValidados = criarMedicaoSchema.parse(req.body);
        const visitaId = Number(req.params.visitaId);
        const medicao = await this.medicaoService.criar(req.usuarioLogado.id, visitaId, dadosValidados);
        return sendSuccess(
            res,
            {
                data: medicao,
                message: 'Medição criada com sucesso!'
            },
            HttpStatus.CREATED
        );
    }

    atualizar = async (req: Request, res: Response): Promise<Response> => {
        const dadosValidados = atualizarMedicaoSchema.parse(req.body);
        const visitaId = Number(req.params.visitaId);
        const medicaoId = Number(req.params.medicaoId);
        const medicao = await this.medicaoService.atualizar(req.usuarioLogado.id, visitaId, medicaoId, dadosValidados);
        return sendSuccess(
            res,
            {
                data: medicao,
                message: 'Medição atualizada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    deletar = async (req: Request, res: Response): Promise<Response> => {
        const visitaId = Number(req.params.visitaId);
        const medicaoId = Number(req.params.medicaoId);
        const medicaoDeletada = await this.medicaoService.deletar(req.usuarioLogado.id, visitaId, medicaoId);
        return sendSuccess(
            res,
            {
                data: medicaoDeletada,
                message: 'Medição deletada com sucesso!'
            },
            HttpStatus.OK
        );
    }

    restaurar = async (req: Request, res: Response): Promise<Response> => {
        const visitaId = Number(req.params.visitaId);
        const medicaoId = Number(req.params.medicaoId);
        const medicaoRestaurada = await this.medicaoService.restaurar(req.usuarioLogado.id, visitaId, medicaoId);
        return sendSuccess(
            res,
            {
                data: medicaoRestaurada,
                message: 'Medição restaurada com sucesso!'
            },
            HttpStatus.OK
        );
    }

}
export default new MedicaoController();