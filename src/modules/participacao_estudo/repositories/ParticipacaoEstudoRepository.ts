import { Prisma, ParticipacaoEstudo, Participante } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarParticipacaoEstudo, criarParticipacaoEstudo, CriarParticipacaoInput } from '../schemas/participacao_estudo.schema';

class ParticipacaoEstudoRepository extends BaseRepository {

    async listaPorEstudo(estudoId: number) {
        return this.prisma.participacaoEstudo.findMany({
            where: {
                estudoId: estudoId
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

    async desvincularAoEstudo(estudoId: number, participanteId: number) {
        return this.prisma.participacaoEstudo.delete({
            where: {
                estudoId_participanteId: { estudoId, participanteId }
            },
        });
    }

    async buscaParticipacao(estudoId: number, participanteId: number) {
        return this.prisma.participacaoEstudo.findUnique({
            where: {
                estudoId_participanteId: {
                    estudoId,
                    participanteId
                }
            },
        });
    }

}
export default ParticipacaoEstudoRepository;
