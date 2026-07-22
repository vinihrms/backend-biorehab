
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import VariavelRepository from '../repositories/VariavelRepository';

import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import { AtualizarVariavelInput, CriarVariavelInput } from '../schemas/variavel.schema';


class VariavelService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private variavelRepository = new VariavelRepository();
    private estudoRepository = new EstudoRepository();


    async estudoExiste(estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }
    }

    async listaVariaveis(estudoId: number, userId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(userId, estudoId);

        return this.variavelRepository.findAllByStudy(estudoId);
    }

    async listaVariaveisPorId(estudoId: number, variavelId: number, userId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(userId, estudoId);

        const variavel = await this.variavelRepository.findById(variavelId);

        if (!variavel) {
            throw new AppError('VAVIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
        }

        return this.variavelRepository.findById(variavelId);
    }

    async criar(data: CriarVariavelInput, userId: number, estudoId: number) {
        await this.estudoExiste(estudoId);

        await this.studyAuthorization.canManageStudy(userId, estudoId);

        const variavelExistente = await this.variavelRepository.findByNameInStudy(data.nome, estudoId);

        if (variavelExistente) {
            throw new AppError('CONFLICT', 'Esta variável já existe para este estudo.', HttpStatus.CONFLICT);
        }

        const variavel = await this.variavelRepository.criar(data, estudoId);

        return variavel;
    }

    async atualizar(userId: number, estudoId: number, variavelId: number, data: AtualizarVariavelInput) {
        await this.estudoExiste(estudoId);

        await this.studyAuthorization.canManageStudy(userId, estudoId);

        const variavelExiste = await this.variavelRepository.findById(variavelId);
        if (!variavelExiste) {
            throw new AppError('STUDY_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
        }

        if (data.nome) {
            const variavelComMesmoNome = await this.variavelRepository.findByNameInStudy(data.nome, estudoId);

            if (variavelComMesmoNome && variavelComMesmoNome.id !== variavelId) {
                throw new AppError(
                    'CONFLICT',
                    'Esta variável já existe.',
                    HttpStatus.CONFLICT
                );
            }
        }
        const variavel = await this.variavelRepository.atualizar(data, estudoId, variavelId);

        return variavel;
    }

    async deletar(userId: number, variavelId: number, estudoId: number) {
        await this.estudoExiste(estudoId);

        await this.studyAuthorization.canManageStudy(userId, estudoId);

        const variavelExiste = await this.variavelRepository.findById(variavelId);
        if (!variavelExiste) {
            throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
        }

        await this.variavelRepository.deletar(variavelId);

    }

    async buscarExcluidas(userId: number, estudoId: number) {
        await this.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);

        return this.variavelRepository.findAllExcluidos(estudoId);

    }

    async restaurar(userId: number, estudoId: number, variavelId: number) {
        await this.estudoExiste(estudoId);

        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const variavel = await this.variavelRepository.findByIdIncludingDeleted(estudoId, variavelId);
        if (!variavel) {
            throw new AppError('VARIAVEL_NOT_FOUND', 'Varivel não encontrado.', HttpStatus.NOT_FOUND);
        }

        if (variavel.deletedAt === null) {
            throw new AppError(
                'VARIAVEL_ALREADY_ACTIVE',
                'Esta variável já está ativa.',
                HttpStatus.CONFLICT
            );
        }

        return this.variavelRepository.restaura(variavel.id);

    }
}

export default VariavelService;
