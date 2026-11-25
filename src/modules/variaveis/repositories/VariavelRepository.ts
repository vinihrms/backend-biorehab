import { Prisma, Variavel } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { serializeVariableOptions } from '../../../utils/choice-options';
import { AtualizarVariavelInput, CriarVariavelInput } from '../schemas/variavel.schema';

class VariavelRepository extends BaseRepository {
  async findAllByStudy(estudoId: number): Promise<Variavel[]> {
    return this.prisma.variavel.findMany({
      where: { estudoId, deletedAt: null },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
  }

  async findById(variavelId: number): Promise<Variavel | null> {
    return this.prisma.variavel.findFirst({
      where: { id: variavelId, deletedAt: null },
    });
  }

  async findByNameInStudy(nome: string, estudoId: number): Promise<Variavel | null> {
    return this.prisma.variavel.findFirst({
      where: { nome, deletedAt: null, estudoId },
    });
  }

  async getNextOrdem(estudoId: number): Promise<number> {
    const agg = await this.prisma.variavel.aggregate({
      where: { estudoId, deletedAt: null },
      _max: { ordem: true },
    });
    return (agg._max.ordem ?? -1) + 1;
  }

  async criar(
    data: CriarVariavelInput,
    estudoId: number,
    ordemFinal: number,
    catalogoVariavelId?: number | null
  ): Promise<Variavel> {
    return this.prisma.variavel.create({
      data: {
        nome: data.nome,
        dataType: data.dataType,
        unidade: data.unidade ?? null,
        allowMultiple: data.dataType === 'choice' ? (data.allowMultiple ?? false) : false,
        options:
          data.dataType === 'choice' ? serializeVariableOptions(data.options) : null,
        ordem: ordemFinal,
        formula: data.dataType === 'calculated' ? (data.formula?.trim() ?? null) : null,
        casasDecimais:
          data.dataType === 'calculated' ? (data.casasDecimais ?? 2) : null,
        catalogoVariavelId: catalogoVariavelId ?? null,
        estudoId,
      },
    });
  }

  async atualizar(
    data: AtualizarVariavelInput,
    _estudoId: number,
    variavelId: number
  ): Promise<Variavel> {
    const updateData: Prisma.VariavelUpdateInput = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.dataType !== undefined) updateData.dataType = data.dataType;
    if (data.unidade !== undefined) updateData.unidade = data.unidade ?? null;
    if (data.allowMultiple !== undefined) updateData.allowMultiple = data.allowMultiple;
    if (data.options !== undefined) {
      updateData.options = serializeVariableOptions(data.options);
    }
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.formula !== undefined) updateData.formula = data.formula?.trim() ?? null;
    if (data.casasDecimais !== undefined) updateData.casasDecimais = data.casasDecimais;

    return this.prisma.variavel.update({
      where: { id: variavelId },
      data: updateData,
    });
  }

  async reordenar(estudoId: number, itens: { id: number; ordem: number }[]): Promise<Variavel[]> {
    await this.prisma.$transaction(
      itens.map((item) =>
        this.prisma.variavel.update({
          where: { id: item.id },
          data: { ordem: item.ordem },
        })
      )
    );

    return this.findAllByStudy(estudoId);
  }

  async deletar(variavelId: number) {
    return this.prisma.variavel.update({
      where: { id: variavelId },
      data: { deletedAt: new Date() },
    });
  }

  async findAllExcluidos(estudoId: number) {
    return this.prisma.variavel.findMany({
      where: { estudoId, deletedAt: { not: null } },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
  }

  async findByIdIncludingDeleted(estudoId: number, variavelId: number) {
    return this.prisma.variavel.findFirst({
      where: { estudoId, id: variavelId },
    });
  }

  async restaura(variavelId: number) {
    return this.prisma.variavel.update({
      where: { id: variavelId },
      data: { deletedAt: null },
    });
  }
}

export default VariavelRepository;
