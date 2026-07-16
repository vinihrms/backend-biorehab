import { CriarPermissaoEstudoInput, AtualizarPermissaoEstudoInput } from './../schemas/permissao_estudo.schema';

import { BaseService } from '../../../services/base.service';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import PermissaoEstudoRepository from '../repositories/PermissaoEstudoRepository';
import { Papel, Estudo } from '@prisma/client';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import UsuarioRepository from '../../usuarios/repositories/UsuarioRepository';


class PermissaoEstudoService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private permissaoEstudoRepository = new PermissaoEstudoRepository();
    private estudoRepository = new EstudoRepository();
    private usuarioRepository = new UsuarioRepository();


    async listaTodas(userId: number, estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canManagePermissions(userId, estudoId);
        return this.permissaoEstudoRepository.findAll(estudoId);
    }

    async create(estudoId: number, data: CriarPermissaoEstudoInput, userId: number) {
        await this.studyAuthorization.canManagePermissions(userId, estudoId);

        const estudo = await this.estudoRepository.findById(estudoId);

        if (!estudo) {
            throw new AppError(
                'STUDY_NOT_FOUND',
                'Estudo não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }

        const usuario = await this.usuarioRepository.findById(data.usuarioId);

        if (!usuario) {
            throw new AppError(
                'USER_NOT_FOUND',
                'Usuário não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }

        if (data.papel === Papel.owner) {
            throw new AppError(
                'INVALID_PERMISSION',
                'Não é permitido criar outro proprietário.',
                HttpStatus.CONFLICT
            );
        }

        const permissao = await this.permissaoEstudoRepository.findByUsuarioAndEstudo(usuario.id, estudoId);

        if (permissao) {
            throw new AppError(
                'PERMISSION_ALREADY_EXISTS',
                'Este usuário já possui acesso ao estudo.',
                HttpStatus.CONFLICT
            );
        }

        return this.permissaoEstudoRepository.create(estudoId, usuario.id, data.papel);
    }

    async atualizar(usuarioLogadoId: number, data: AtualizarPermissaoEstudoInput, estudoId: number, usuarioId: number) {
        await this.studyAuthorization.canManagePermissions(usuarioLogadoId, estudoId);
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }
        const usuario = await this.usuarioRepository.findById(usuarioId);
        if (!usuario) {
            throw new AppError(
                'USER_NOT_FOUND',
                'Usuário não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }
        
        if (data.papel === Papel.owner) {
            throw new AppError(
                'INVALID_PERMISSION',
                'Não é permitido criar outro proprietário.',
                HttpStatus.CONFLICT
            );
        }

        const permissao = await this.permissaoEstudoRepository.findByUsuarioAndEstudo(usuario.id, estudoId);
        if (!permissao) {
            throw new AppError(
                'PERMISSION_NOT_FOUND',
                'Permissão não encontrada.',
                HttpStatus.NOT_FOUND
            );
        }

        return this.permissaoEstudoRepository.atualizar(estudoId, usuarioId, data);
    }

    async deletar(usuarioLogadoId: number, estudoId: number, usuarioId: number) {
        await this.studyAuthorization.canManagePermissions(usuarioLogadoId, estudoId);
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        const usuario = await this.usuarioRepository.findById(usuarioId);
        if (!usuario) {
            throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
        }

        const permissao =
            await this.permissaoEstudoRepository.findByUsuarioAndEstudo(
                usuarioId,
                estudoId
            );

        if (!permissao) {
            throw new AppError(
                'PERMISSION_NOT_FOUND',
                'Permissão não encontrada.',
                HttpStatus.NOT_FOUND
            );
        }

        if (permissao.papel === Papel.owner) {
            throw new AppError(
                'OWNER_PERMISSION',
                'O proprietário do estudo não pode ser removido.',
                HttpStatus.CONFLICT
            );
        }

        return this.permissaoEstudoRepository.hardDelete(estudoId, usuarioId);
    }

}

export default PermissaoEstudoService;
