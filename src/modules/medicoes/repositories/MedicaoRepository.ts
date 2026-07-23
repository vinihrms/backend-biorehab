import { BaseRepository } from '../../../repositories/base.repository';
import { AtualizarMedicaoInput, CriarMedicaoInput } from '../schemas/medicao.schema';

class MedicaoRepository extends BaseRepository {

    async listarPorVisita(visitaId: number) {
        return this.prisma.medicao.findMany({
            where: {
                visitaId: visitaId,
                deletedAt: null
            },
            include: {
                variavel: true,
                visita: true
            },
            orderBy: {
                variavel: {
                    nome: 'asc'
                }
            }
        });
    }

    async buscaPorId(visitaId: number, medicaoId: number) {
        return this.prisma.medicao.findFirst({
            where: {
                visitaId,
                id: medicaoId,
                deletedAt: null
            },
            include: {
                variavel: true,
                visita: true
            }
        });
    }

    async buscaPorIdComDeletado(visitaId: number, medicaoId: number) {
        return this.prisma.medicao.findFirst({
            where: {
                visitaId,
                id: medicaoId,
            },
            include: {
                variavel: true
            }
        });
    }

    async criar(visitaId: number, usuarioId: number, data: CriarMedicaoInput) {
        return this.prisma.medicao.create({
            data: {
                visitaId,
                variavelId: data.variavelId,
                valorNum: data.valorNum ?? null,
                valorText: data.valorText ?? null,
                lado: data.lado ?? null,
                createdBy: usuarioId
            }
        });
    }

    async atualizar(medicaoId: number, data: AtualizarMedicaoInput) {
        const updateData: Record<string, unknown> = {};

        if (data.valorNum !== undefined) {
            updateData.valorNum = data.valorNum;
        }

        if (data.valorText !== undefined) {
            updateData.valorText = data.valorText;
        }
        if (data.lado !== undefined) {
            updateData.lado = data.lado;
        }

        return this.prisma.medicao.update({
            where: {
                id: medicaoId
            },
            data: updateData
        });
    }

    async apagar(medicaoId: number) {
        return this.prisma.medicao.update({
            where: {
                id: medicaoId
            },
            data: {
                deletedAt: new Date()
            }
        });
    }

    async restaurar(medicaoId: number) {
        return this.prisma.medicao.update({
            where: {
                id: medicaoId
            },
            data: {
                deletedAt: null
            }
        });
    }

    async listarExcluidas(visitaId: number) {
        return this.prisma.medicao.findMany({
            where: {
                visitaId: visitaId,
                deletedAt: { not: null }
            },
            include: {
                variavel: true
            },
            orderBy: {
                variavel: {
                    nome: 'asc'
                }
            }
        });
    }

    async existeMesmaVariavel(visitaId: number, variavelId: number) {
        return this.prisma.medicao.findFirst({
            where: {
                visitaId,
                variavelId,
                deletedAt: null
            }
        });
    }
    async existeMesmaVariavelcomDeleted(visitaId: number, variavelId: number) {
        return this.prisma.medicao.findFirst({
            where: {
                visitaId,
                variavelId,
            }
        });
    }
}
export default MedicaoRepository;
