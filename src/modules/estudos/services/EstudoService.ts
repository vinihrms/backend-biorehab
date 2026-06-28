
import { BaseService } from '../../../services/base.service';
import { AtualizarEstudoInput, CriarEstudoInput } from '../../estudos/schemas/estudo.schema';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import EstudoRepository from '../repositories/EstudoRepository';
import PermissaoEstudoRepository from '../../permissao_estudos/repositories/PermissaoEstudoRepository';
import { Papel, Estudo } from '@prisma/client';
import AdminAuthorization from '../../../authorization/AdminAuthorization';
import { number } from 'zod';


class EstudoService extends BaseService {

    private estudoRepository = new EstudoRepository();
    private permissaoEstudoRepository = new PermissaoEstudoRepository();
    private adminAuthorization = new AdminAuthorization();

    async create(data: CriarEstudoInput, userId: number) {
        const usuario = await this.adminAuthorization.isAdmin(userId);
        const estudoExistente = await this.estudoRepository.findByName(data.nome);

        if (estudoExistente) {
            throw new AppError('CONFLICT', 'Este estudo já existe.', HttpStatus.CONFLICT);
        }

        if(data.sigla){
            const siglaExistente = await this.estudoRepository.findBySigla(data.sigla);
            if(siglaExistente){
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


    async list(userId: number) {
        await this.adminAuthorization.isAdmin(userId);
        return this.estudoRepository.findAll();
    }

    async getById(userId: number, estudoId: number) {
        await this.adminAuthorization.isAdmin(userId);
        const estudo = await this.estudoRepository.findById(estudoId);

        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        return estudo;
    }

    async atualizarEstudo(userId: number, estudoId: number, data: AtualizarEstudoInput) {
        await this.adminAuthorization.isAdmin(userId);
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

        if(data.sigla){
            const siglaExistente = await this.estudoRepository.findBySigla(data.sigla);
            if(siglaExistente && siglaExistente.id != estudoId){
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
        await this.adminAuthorization.isAdmin(userId);
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        return this.estudoRepository.softDelete(estudoId);
    }
}

export default EstudoService;
