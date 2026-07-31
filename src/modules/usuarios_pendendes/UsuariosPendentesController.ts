import { HttpStatus } from "../../utils/http-status";
import { sendSuccess } from "../../utils/response";
import UsuariosPendentesService from "./UsuariosPendentesService";
import type { Request, Response } from 'express';

class UsuariosPendentesController {

    private usuariosPendentesService = new UsuariosPendentesService();

    listarTodosPendentes = async (req: Request, res: Response): Promise<Response> => {

        const usuariosPendentes = await this.usuariosPendentesService.listarTodosPendentes(req.usuarioLogado.id)
        return sendSuccess(
            res,
            {
                data: usuariosPendentes,
                message: 'Usuários pendentes listados com sucesso!'
            },
            HttpStatus.OK
        );
    };

    ativar = async (req: Request, res: Response): Promise<Response> => {
        const usuarioId = Number(req.params.usuarioId);
        const usuarioAtivo = await this.usuariosPendentesService.ativar(req.usuarioLogado.id, usuarioId)
        return sendSuccess(
            res,
            {
                data: usuarioAtivo,
                message: 'Usuário ativado com sucesso!'
            },
            HttpStatus.OK
        );
    };

    recusar = async (req: Request, res: Response): Promise<Response> => {
        const usuarioId = Number(req.params.usuarioId);
        const usuarioRecusado = await this.usuariosPendentesService.recusar(req.usuarioLogado.id, usuarioId)
        return sendSuccess(
            res,
            {
                data: usuarioRecusado,
                message: 'Usuário recusado com sucesso!'
            },
            HttpStatus.OK
        );
    };


}

export default new UsuariosPendentesController();