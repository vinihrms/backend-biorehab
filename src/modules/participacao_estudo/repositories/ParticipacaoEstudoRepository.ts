import { Prisma, ParticipacaoEstudo, Participante } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarParticipacaoEstudo, criarParticipacaoEstudo, CriarParticipacaoInput } from '../schemas/participacao_estudo.schema';
import id from 'zod/v4/locales/id.js';

class ParticipacaoEstudoRepository extends BaseRepository {

    async listaPorEstudo(estudoId: number) {
        return this.prisma.participacaoEstudo.findMany({
            where: {
                estudoId: estudoId, deletedAt: null
            },
            include: {
                participante: true
            },
            orderBy: {
                codigo: "asc"
            }
        });
    }

    async listarExcluidos(estudoId: number) {
        return this.prisma.participacaoEstudo.findMany({
            where: {
                estudoId: estudoId, deletedAt: { not: null }
            },
            include: {
                participante: true
            },
            orderBy: {
                codigo: "asc"
            }
        });
    }

    // para gerar o código
    async buscarUltimaParticipacao(estudoId: number) {
        return this.prisma.participacaoEstudo.findFirst({
            where: {
                estudoId
            },
            orderBy: {
                id: "desc"
            },
            select: {
                codigo: true
            }
        });
    }

    async vincularAoEstudo(estudoId: number, dadosValidados: CriarParticipacaoInput, codigo: string) {
        return this.prisma.participacaoEstudo.create({
            data: {
                estudoId: estudoId,
                participanteId: dadosValidados.participanteId,
                codigo
            }
        });
    }

    async apagar(id: number) {
        return this.prisma.participacaoEstudo.update({
            where: {
                id
            },
            data: {
                deletedAt: new Date()
            }
        });
    }

    async buscaParticipacaoPorId(participacaoId: number){
        return this.prisma.participacaoEstudo.findUnique({
            where: {
                id: participacaoId,
                deletedAt: {not: null}
            }
        })
    }


    async buscaParticipacao(estudoId: number, participanteId: number) {
        return this.prisma.participacaoEstudo.findFirst({
            where: {
                estudoId,
                participanteId,
                deletedAt: null
            },
            include: {
                participante: true
            }
        });
    }

    async buscarPorIdCom(estudoId: number, participanteId: number) {
        return this.prisma.participacaoEstudo.findFirst({
            where: {
                estudoId,
                participanteId
            }
        });
    }

    async restaura(participacaoId: number) {
        return this.prisma.participacaoEstudo.update({
            where: {
                id: participacaoId
            },
            data: {
                deletedAt: null
            }
        });
    }
}
export default ParticipacaoEstudoRepository;
