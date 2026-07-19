
import { BaseService } from '../../../services/base.service';
import { AtualizarEstudoInput, CriarEstudoInput } from '../../estudos/schemas/estudo.schema';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import EstudoRepository from '../repositories/EstudoRepository';
import PermissaoEstudoRepository from '../../permissao_estudos/repositories/PermissaoEstudoRepository';
import { Papel, Estudo, Usuario } from '@prisma/client';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { number } from 'zod';
import UsuarioRepository from '../../usuarios/repositories/UsuarioRepository';
import AdminAuthorization from '../../../authorization/AdminAuthorization';


class EstudoService extends BaseService {

    private estudoRepository = new EstudoRepository();
    private permissaoEstudoRepository = new PermissaoEstudoRepository();
    private studyAuthorization = new StudyAuthorization();
    private usuarioRepositorio = new UsuarioRepository();
    private adminAuthorization = new AdminAuthorization();

    async create(data: CriarEstudoInput, userId: number) {
        const usuario = await this.adminAuthorization.isAdmin(userId);

        const estudoExistente = await this.estudoRepository.findByName(data.nome);

        if (estudoExistente) {
            throw new AppError('CONFLICT', 'Este estudo já existe.', HttpStatus.CONFLICT);
        }

        if (data.sigla) {
            const siglaExistente = await this.estudoRepository.findBySigla(data.sigla);
            if (siglaExistente) {
                throw new AppError(
                    'CONFLICT',
                    'Esta sigla já está em uso.',
                    HttpStatus.CONFLICT
                );
            }
        }

        const estudo = await this.estudoRepository.create(data);

        await this.permissaoEstudoRepository.create(
            estudo.id,
            usuario.id,
            Papel.owner
        );


        return estudo;
    }


    async listaEstudos(userId: number) {
        const usuario = await this.usuarioRepositorio.findById(userId);
        if (!usuario) {
            throw new AppError(
                'USER_NOT_FOUND',
                'Usuário não encontrado.',
                HttpStatus.NOT_FOUND
            );
        }

        if(usuario.isAdmin){
            return this.estudoRepository.findAll();
        }

        return this.estudoRepository.findAllByUsario(userId);
    }

    async getById(userId: number, estudoId: number) {
        await this.studyAuthorization.canView(userId, estudoId);
        
        const estudo = await this.estudoRepository.findById(estudoId);
        
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        return estudo;
    }

    async atualizarEstudo(userId: number, estudoId: number, data: AtualizarEstudoInput) {
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        if (data.nome) {
            const estudoExistente = await this.estudoRepository.findByName(data.nome);

            if (estudoExistente && estudoExistente.id !== estudoId) {
                throw new AppError(
                    'CONFLICT',
                    'Este estudo já existe.',
                    HttpStatus.CONFLICT
                );
            }
        }

        if (data.sigla) {
            const siglaExistente = await this.estudoRepository.findBySigla(data.sigla);
            if (siglaExistente && siglaExistente.id != estudoId) {
                throw new AppError(
                    'CONFLICT',
                    'Esta sigla já está em uso.',
                    HttpStatus.CONFLICT
                );
            }
        }

        return this.estudoRepository.update(estudoId, data);


    }

    async deletarEstudo(userId: number, estudoId: number) {
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        return this.estudoRepository.softDelete(estudoId);
    }


    async buscarExcluidos(userId: number) {
        await this.usuarioRepositorio.findById(userId);
        await this.adminAuthorization.isAdmin(userId);
        return this.estudoRepository.findAllExcluidos();
    }



    async restaurarEstudo(userId: number, estudoId: number) {
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const estudo = await this.estudoRepository.findByIdIncludingDeleted(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        if (estudo.deletedAt === null) {
            throw new AppError(
                'STUDY_ALREADY_ACTIVE',
                'Este estudo já está ativo.',
                HttpStatus.CONFLICT
            );
        }

        return this.estudoRepository.restaura(estudoId);
        
    }
}

export default EstudoService;
