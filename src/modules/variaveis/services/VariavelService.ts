
import { BaseService } from '../../../services/base.service';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import VariavelRepository from '../repositories/VariavelRepository';

import { AtualizarVariavelInput, CriarVariavelInput } from '../schemas/variavel.schema';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';


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
        await this.studyAuthorization.canView(userId, estudoId);

        return this.variavelRepository.findAllByStudy(estudoId);
    }

    async listaVariaveisPorId(estudoId: number, variavelId: number, userId: number) {
        await this.studyAuthorization.canView(userId, estudoId);

        return this.variavelRepository.findById(variavelId);
    }

    async criar(data: CriarVariavelInput, userId: number, estudoId: number) {
        await this.studyAuthorization.canManageStudy(userId, estudoId);

        const variavelExistente = await this.variavelRepository.findByNameInStudy(data.nome, estudoId);

        if (variavelExistente) {
            throw new AppError('CONFLICT', 'Esta variável já existe para este estudo.', HttpStatus.CONFLICT);
        }

        const variavel = await this.variavelRepository.criar(data, estudoId);

        return variavel;
    }

    async atualizar(userId: number, estudoId: number, variavelId: number, data: AtualizarVariavelInput) {
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
            throw new AppError('STUDY_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
        }

        await this.variavelRepository.deletar(variavelId);

    }

    async buscarExcluidos(userId: number, estudoId: number){
        await this.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        
    }
}

export default VariavelService;
