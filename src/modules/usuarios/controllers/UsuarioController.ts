import type { Request, Response } from 'express';
import { HttpStatus } from '../../../utils/http-status';
import { sendSuccess } from '../../../utils/response';
import { loginSchema } from '../../auth/schemas/login.schema';
import { cadastrarUsuarioSchema } from '../../auth/schemas/register.schema';
import AuthService from '../../auth/services/AuthService';
import { atualizarUsuarioSchema } from '../schemas/usuario.schema';
import UsuarioService from '../services/UsuarioService';

class UsuarioController {
  private AuthService = new AuthService();
  private usuarioService = new UsuarioService();

  listar = async (req: Request, res: Response): Promise<Response> => {
    const usuarios = await this.usuarioService.listar((req as Request & { usuarioLogado: { id: number } }).usuarioLogado.id);
    return sendSuccess(res, { data: usuarios }, HttpStatus.OK);
  };

  buscarPorId = async (req: Request, res: Response): Promise<Response> => {
    const usuario = await this.usuarioService.buscarPorId(
      (req as Request & { usuarioLogado: { id: number } }).usuarioLogado.id,
      Number(req.params.usuarioId),
    );
    return sendSuccess(res, { data: usuario }, HttpStatus.OK);
  };

  atualizar = async (req: Request, res: Response): Promise<Response> => {
    const usuario = await this.usuarioService.atualizar(
      (req as Request & { usuarioLogado: { id: number } }).usuarioLogado.id,
      Number(req.params.usuarioId),
      atualizarUsuarioSchema.parse(req.body),
    );
    return sendSuccess(res, { data: usuario }, HttpStatus.OK);
  };

  excluir = async (req: Request, res: Response): Promise<Response> => {
    await this.usuarioService.excluir(
      (req as Request & { usuarioLogado: { id: number } }).usuarioLogado.id,
      Number(req.params.usuarioId),
    );
    return sendSuccess(res, { data: null }, HttpStatus.NO_CONTENT);
  };

  cadastrar = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = cadastrarUsuarioSchema.parse(req.body);
    const usuario = await this.AuthService.cadastrar(dadosValidados);
    return sendSuccess(res, { data: usuario }, HttpStatus.CREATED);
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const dadosValidados = loginSchema.parse(req.body);
    const resultado = await this.AuthService.login(dadosValidados);
    return sendSuccess(res, { data: resultado }, HttpStatus.OK);
  };
}

export default new UsuarioController();