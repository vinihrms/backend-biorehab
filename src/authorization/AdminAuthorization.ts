import UsuarioRepository from "../modules/usuarios/repositories/UsuarioRepository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../utils/http-status";

class AdminAuthorization {

    private usuarioRepository = new UsuarioRepository();

    async isAdmin(userId: number){
        const usuario = await this.usuarioRepository.findById(userId);
        if(!usuario){
            throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
        }

        if(!usuario.isAdmin){
            throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', HttpStatus.FORBIDDEN);
        }

        return usuario;
    }

}

export default AdminAuthorization;