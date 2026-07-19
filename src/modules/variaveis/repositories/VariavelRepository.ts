import { Variavel } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { number } from 'zod';
import { AtualizarVariavelInput, CriarVariavelInput } from '../schemas/variavel.schema';

class VariavelRepository extends BaseRepository {

    async findAllByStudy(estudoId: number) {
        return this.prisma.variavel.findMany({ where: { estudoId, deletedAt: null } })
    }

    async findById(variavelId: number) {
        return this.prisma.variavel.findFirst({ where: { id: variavelId, deletedAt: null } })
    }

    async findByNameInStudy(nome: string, estudoId: number) {
        return this.prisma.variavel.findFirst({ where: { nome, deletedAt: null, estudoId } });
    }

    async criar(data: CriarVariavelInput, estudoId: number) {
        return this.prisma.variavel.create({
            data: {
                nome: data.nome,
                dataType: data.dataType,
                unidade: data.unidade ?? null,
                options: data.options ?? null,
                estudoId
            }
        });
    }

    async atualizar(data: AtualizarVariavelInput, estudoId: number, variavelId: number) {
        const updateData: Record<string, unknown> = {};

        if (data.nome !== undefined) {
            updateData.nome = data.nome;
        }

        if (data.dataType !== undefined) {
            updateData.dataType = data.dataType;
        }

        if (data.options !== undefined) {
            updateData.options = data.options;
        }
        if (data.unidade !== undefined) {
            updateData.unidade = data.unidade;
        }

        return this.prisma.variavel.update({
            where: {
                id: variavelId,
            },
            data: updateData,
        });
    }

    async deletar(variavelId: number) {
        return this.prisma.variavel.update({
            where: {
                id: variavelId
            },
            data: {
                deletedAt: new Date()
            }
        });
    }

    async findAllExcluidos(estudoId: number) {
        return this.prisma.variavel.findMany({
            where: {
                estudoId: estudoId, deletedAt: { not: null }
            },
        });
    }

    async findByIdIncludingDeleted(estudoId: number, variavelId: number) {
        return this.prisma.variavel.findFirst({
            where: {
                estudoId: estudoId, id: variavelId
            },
        });
    }

    async restaura(variavelId: number) {
        return this.prisma.variavel.update({
            where: {
                id: variavelId
            },
            data: {
                deletedAt: null
            }
        });
    }

}

export default VariavelRepository;
