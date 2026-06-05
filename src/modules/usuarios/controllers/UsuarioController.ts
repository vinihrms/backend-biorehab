import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { loginSchema } from '../schemas/login.schema';
import { cadastrarUsuarioSchema } from '../schemas/usuario.schema';
import UsuarioService from '../services/UsuarioService';

class UsuarioController {
  private usuarioService = new UsuarioService();

  cadastrar = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = cadastrarUsuarioSchema.parse(req.body);
    const usuario = await this.usuarioService.cadastrar(dadosValidados);
    return sendSuccess(res, { data: usuario }, HttpStatus.CREATED);
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = loginSchema.parse(req.body);
    const resultado = await this.usuarioService.login(dadosValidados);
    return sendSuccess(res, { data: resultado }, HttpStatus.OK);
  };
}

export default new UsuarioController();