import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import UsuarioRepository, { UsuarioPublic } from '../repositories/UsuarioRepository';
import { CadastrarUsuarioInput } from '../schemas/usuario.schema';
import { LoginInput } from '../schemas/login.schema';

type LoginResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    ra: string;
    isAdmin: boolean;
  };
  token: string;
};

class UsuarioService extends BaseService {
  private usuarioRepository = new UsuarioRepository();

  async cadastrar(data: CadastrarUsuarioInput): Promise<UsuarioPublic> {
    const usuarioExistente = await this.usuarioRepository.findByEmailOrRa(data.email, data.ra);

    if (usuarioExistente) {
      throw new AppError('USER_ALREADY_EXISTS', 'Email or RA already registered.', HttpStatus.CONFLICT);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(data.password, salt);

    return this.usuarioRepository.create({
      email: data.email,
      password: senhaCriptografada,
      ra: data.ra,
      name: data.name,
      isAdmin: data.isAdmin ?? false,
    });
  }

  async login(data: LoginInput): Promise<LoginResponse> {
    const usuario = await this.usuarioRepository.findByEmail(data.email);

    if (!usuario) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', HttpStatus.UNAUTHORIZED);
    }

    const senhaValida = await bcrypt.compare(data.password, usuario.password);

    if (!senhaValida) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', HttpStatus.UNAUTHORIZED);
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('CONFIG_ERROR', 'JWT secret not configured.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const token = jwt.sign({ id: usuario.id, isAdmin: usuario.isAdmin }, secret, { expiresIn: '1d' });

    return {
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        ra: usuario.ra,
        isAdmin: usuario.isAdmin,
      },
      token,
    };
  }
}

export default UsuarioService;
