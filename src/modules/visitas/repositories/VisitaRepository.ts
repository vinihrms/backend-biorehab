import { Variavel } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { number } from 'zod';
import { AtualizarVisitaInput, CriarVisitaInput } from '../schemas/visita.schema';

class VisitaRepository extends BaseRepository {

    async listaPorParticipacao(participacaoId: number) {
        return this.prisma.visita.findMany({
            where: {
                participacaoEstudoId: participacaoId,
                deletedAt: null
            },
            include: {
                tipoVisita: true
            },
            orderBy: {
                data: "asc"
            }
        });
    }

    async listarExcluidas(participacaoId: number) {
        return this.prisma.visita.findMany({
            where: {
                participacaoEstudoId: participacaoId,
                deletedAt: { not: null }
            },
            include: {
                tipoVisita: true
            },
            orderBy: {
                data: "asc"
            }
        });
    }

    async buscaPorId(participacaoId: number, visitaId: number) {
        return this.prisma.visita.findFirst({
            where: {
                participacaoEstudoId: participacaoId,
                id: visitaId,
                deletedAt: null
            },
            include: {
                tipoVisita: true
            }
        });
    }

    async buscaPorIdComDeletado(participacaoId: number, visitaId: number) {
        return this.prisma.visita.findFirst({
            where: {
                participacaoEstudoId: participacaoId,
                id: visitaId
            },
            include: {
                tipoVisita: true
            }
        });
    }

    async criar(participacaoId: number, usuarioId: number, data: CriarVisitaInput) {
        return this.prisma.visita.create({
            data: {
                participacaoEstudoId: participacaoId,
                tipoVisitaId: data.tipoVisitaId,
                data: data.data,
                notes: data.notes ?? null,
                createdBy: usuarioId
            }
        });
    }
    async atualizar(visitaId: number, data: AtualizarVisitaInput) {
        const updateData: Record<string, unknown> = {};

        if (data.data !== undefined) {
            updateData.data = data.data;
        }

        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        return this.prisma.visita.update({
            where: {
                id: visitaId
            },
            data: updateData
        });
    }

    async apagar(visitaId: number) {
        return this.prisma.visita.update({
            where: {
                id: visitaId
            },
            data: {
                deletedAt: new Date()
            }
        });
    }

    async restaurar(visitaId: number) {
        return this.prisma.visita.update({
            where: {
                id: visitaId
            },
            data: {
                deletedAt: null
            }
        });
    }

    async existeMesmoTipo(participacaoId: number, tipoVisitaId: number) {
        return this.prisma.visita.findFirst({
            where: {
                participacaoEstudoId: participacaoId,
                tipoVisitaId,
                deletedAt: null
            }
        });
    }

    async existeMesmoTipoIncluindoExcluidas(participacaoId: number, tipoVisitaId: number) {
        return this.prisma.visita.findFirst({
            where: {
                participacaoEstudoId: participacaoId,
                tipoVisitaId,
            }
        });
    }
}
export default VisitaRepository;
