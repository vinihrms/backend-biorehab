import {
  atualizarTipoVisita,
  CriarTipoVisitaInput,
  ReordenarTiposVisitaInput,
} from '../schemas/tipos_visita.schema';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import TiposVisitaRepository from '../repositories/TiposVisitaRepository';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
class TiposVisitaService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private tiposVisitaRepository = new TiposVisitaRepository();
    private estudoRepository = new EstudoRepository();
    private validacaoStatus = StudyStatusValidation;

    async estudoExiste(estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        return estudo;
    }
    async listaPorEstudo(usuarioId: number, estudoId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canView(usuarioId, estudoId);

        return await this.tiposVisitaRepository.listaTodosPorEstudo(estudoId);

    }

    async criaTipoDeVisita(usuarioId: number, estudoId: number, dadosValidados: CriarTipoVisitaInput) {
        const estudo = await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(usuarioId, estudoId);

        await this.validacaoStatus.canEditStructure(estudo);

        const tipoVisitaExistente = await this.tiposVisitaRepository.findByName(estudoId, dadosValidados.nome);

        if (tipoVisitaExistente) {
            throw new AppError('CONFLICT', 'Este tipo de visita já existe para este estudo.', HttpStatus.CONFLICT);
        }

        const ordemFinal = dadosValidados.ordem ?? (await this.tiposVisitaRepository.getNextOrdem(estudoId));
        const tipoVisita = await this.tiposVisitaRepository.criar(
            estudoId,
            dadosValidados,
            ordemFinal
        );

        return tipoVisita;

    }

    async buscaPorId(usuarioId: number, estudoId: number, tipoVisitaId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canView(usuarioId, estudoId);

        const tipoVisita = await this.tiposVisitaRepository.buscaPorId(estudoId, tipoVisitaId);

        if (!tipoVisita) {
            throw new AppError('TIPO_VISITA_NOT_FOUND', 'Tipo de visita não encontrado.', HttpStatus.NOT_FOUND);
        }

        return tipoVisita;

    }

    async atualizar(userId: number, estudoId: number, data: atualizarTipoVisita, tipoVisitaId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const tipoVisita = await this.tiposVisitaRepository.buscaPorId(estudoId, tipoVisitaId);

        if (!tipoVisita || tipoVisita.estudoId !== estudoId) {
            throw new AppError(
                "TIPO_VISITA_NOT_FOUND",
                "Tipo de visita não encontrado.",
                HttpStatus.NOT_FOUND
            );
        }

        if (data.nome) {
            const tipoVisita = await this.tiposVisitaRepository.findByName(estudoId, data.nome);

            if (tipoVisita && tipoVisita.id !== tipoVisitaId) {
                throw new AppError(
                    'CONFLICT',
                    'Este tipo de visita já existe.',
                    HttpStatus.CONFLICT
                );
            }
        }

        return this.tiposVisitaRepository.update(tipoVisitaId, data);

    }

    async apaga(userId: number, estudoId: number, tipoVisitaId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const tipoVisita = await this.tiposVisitaRepository.buscaPorId(estudoId, tipoVisitaId);

        if (!tipoVisita || tipoVisita.estudoId !== estudoId) {
            throw new AppError(
                "TIPO_VISITA_NOT_FOUND",
                "Tipo de visita não encontrado.",
                HttpStatus.NOT_FOUND
            );
        }

        return this.tiposVisitaRepository.apaga(tipoVisitaId);

    }

    async buscaExcluidos(usuarioId: number, estudoId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canView(usuarioId, estudoId);

        const tiposVisita = await this.tiposVisitaRepository.buscaExcluidos(estudoId);

        return tiposVisita;

    }

    async restaura(userId: number, estudoId: number, tipoVisitaId: number) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);
        const tipoVisita = await this.tiposVisitaRepository.buscaPorIdComDeletado(tipoVisitaId);

        if (!tipoVisita) {
            throw new AppError(
                "TIPO_VISITA_NOT_FOUND",
                "Tipo de visita não encontrado.",
                HttpStatus.NOT_FOUND
            );
        }

        if (tipoVisita.deletedAt === null) {
            throw new AppError(
                'TIPO_VISITA_ALREADY_ACTIVE',
                'Este tipo de visita já está ativo.',
                HttpStatus.CONFLICT
            );
        }

        return this.tiposVisitaRepository.restaura(tipoVisitaId);

    }

    async reordenar(userId: number, estudoId: number, data: ReordenarTiposVisitaInput) {
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canManageStudy(userId, estudoId);

        const existentes = await this.tiposVisitaRepository.listaTodosPorEstudo(estudoId);
        const idsValidos = new Set(existentes.map((t) => t.id));

        for (const item of data.itens) {
            if (!idsValidos.has(item.id)) {
                throw new AppError(
                    'TIPO_VISITA_NOT_FOUND',
                    `Tipo de visita ID ${item.id} não pertence a este estudo.`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        return this.tiposVisitaRepository.reordenar(estudoId, data.itens);
    }


}

export default TiposVisitaService;
