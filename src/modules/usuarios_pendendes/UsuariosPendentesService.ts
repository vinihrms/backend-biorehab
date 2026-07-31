import AdminAuthorization from "../../authorization/AdminAuthorization";
import { AppError } from "../../errors/app-error";
import { BaseService } from "../../services/base.service";
import { HttpStatus } from "../../utils/http-status";
import UsuariosPendentesRepository from "./UsuariosPendentesRepository";

class UsuariosPendentesService extends BaseService {
    private usuariosPendentesRepository = new UsuariosPendentesRepository();
    private adminAuthorization = new AdminAuthorization();

    async listarTodosPendentes(userLogadoId: number) {
        await this.adminAuthorization.isAdmin(userLogadoId);

        return this.usuariosPendentesRepository.findAll();
    }

    async ativar(userLogadoId: number, userId: number) {
        await this.adminAuthorization.isAdmin(userLogadoId);

        const usuarioQueSeraAtivado = await this.usuariosPendentesRepository.findById(userId);
        if (!usuarioQueSeraAtivado) {
            throw new AppError(
                'USER_NOT_FOUND',
                'Usuário não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }

        await this.usuariosPendentesRepository.ativar(userId);
    }

    async recusar(userLogadoId: number, userId: number) {
        await this.adminAuthorization.isAdmin(userLogadoId);

        const usuarioQueSeraDeletado = await this.usuariosPendentesRepository.findById(userId);
        if (!usuarioQueSeraDeletado) {
            throw new AppError(
                'USER_NOT_FOUND',
                'Usuário não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }

        await this.usuariosPendentesRepository.hardDelete(userId);
    }

};

export default UsuariosPendentesService;