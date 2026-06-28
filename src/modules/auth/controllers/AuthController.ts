  import type { Request, Response } from 'express';
  import { HttpStatus } from '../../../utils/http-status';
  import { sendSuccess } from '../../../utils/response';
  import { cadastrarUsuarioSchema } from '../schemas/register.schema';
  import { loginSchema } from '../schemas/login.schema';
  import AuthService from '../services/AuthService';

  class AuthController {
    private authService = new AuthService();

    cadastrar = async (req: Request, res: Response): Promise<Response> => {
      const dadosValidados = cadastrarUsuarioSchema.parse(req.body);
      const usuario = await this.authService.cadastrar(dadosValidados);
      return sendSuccess(res, { data: usuario }, HttpStatus.CREATED);
    };

    login = async (req: Request, res: Response): Promise<Response> => {
      const dadosValidados = loginSchema.parse(req.body);
      const resultado = await this.authService.login(dadosValidados);
      return sendSuccess(res, { data: resultado }, HttpStatus.OK);
    };
  }

  export default new AuthController();
