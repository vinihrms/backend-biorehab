
import { BaseService } from '../../../services/base.service';
import { CriarEstudoInput } from '../../estudos/schemas/estudo.schema';
import UsuarioRepository from '../../usuarios/repositories/UsuarioRepository';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import EstudoRepository from '../repositories/EstudoRepository';
import PermissaoEstudoRepository from '../../permissao_estudos/repositories/PermissaoEstudoRepository';
import { Papel } from '@prisma/client';

class EstudoService extends BaseService {

private usuarioRepository = new UsuarioRepository();
private estudoRepository = new EstudoRepository();
private permissaoEstudoRepository = new PermissaoEstudoRepository();

  async create(
    data: CriarEstudoInput,
    userId: number
    ){
        const usuario = await this.usuarioRepository.findById(userId);
        if(!usuario){
            throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
        }

        if(!usuario.isAdmin){
            throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', HttpStatus.FORBIDDEN);
        }

        const estudoExistente = await this.estudoRepository.findByName(data.nome);

        if(estudoExistente){
            throw new AppError('CONFLICT', 'Este estudo já existe.', HttpStatus.CONFLICT);
        }

        const estudo = await this.estudoRepository.create(data);
        
        await this.permissaoEstudoRepository.create(
            estudo.id,
            usuario.id,
            Papel.owner
        );


        return estudo;
    }
}

export default EstudoService;
