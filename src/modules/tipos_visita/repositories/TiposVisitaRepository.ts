import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarTipoVisita, CriarTipoVisitaInput } from '../schemas/tipos_visita.schema';

class TiposVisitaRepository extends BaseRepository {
  async listaTodosPorEstudo(estudoId: number) {
    return this.prisma.tipoVisita.findMany({
      where: { estudoId, deletedAt: null },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
  }

  async findByName(estudoId: number, nome: string) {
    return this.prisma.tipoVisita.findFirst({
      where: { estudoId, nome, deletedAt: null },
    });
  }

  async getNextOrdem(estudoId: number): Promise<number> {
    const agg = await this.prisma.tipoVisita.aggregate({
      where: { estudoId, deletedAt: null },
      _max: { ordem: true },
    });
    return (agg._max.ordem ?? -1) + 1;
  }

  async criar(
    estudoId: number,
    data: CriarTipoVisitaInput,
    ordemFinal: number,
    catalogoTipoVisitaId?: number | null
  ) {
    return this.prisma.tipoVisita.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        ordem: ordemFinal,
        catalogoTipoVisitaId: catalogoTipoVisitaId ?? null,
        estudoId,
      },
    });
  }

  async buscaPorId(estudoId: number, tipoVisitaId: number) {
    return this.prisma.tipoVisita.findFirst({
      where: { estudoId, id: tipoVisitaId, deletedAt: null },
    });
  }

  async update(tipoVisitaId: number, data: atualizarTipoVisita) {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.descricao !== undefined) updateData.descricao = data.descricao ?? null;
    if (data.ordem !== undefined) updateData.ordem = data.ordem;

    return this.prisma.tipoVisita.update({
      where: { id: tipoVisitaId },
      data: updateData,
    });
  }

  async reordenar(estudoId: number, itens: { id: number; ordem: number }[]) {
    await this.prisma.$transaction(
      itens.map((item) =>
        this.prisma.tipoVisita.update({
          where: { id: item.id },
          data: { ordem: item.ordem },
        })
      )
    );
    return this.listaTodosPorEstudo(estudoId);
  }

  async apaga(tipoVisitaId: number) {
    return this.prisma.tipoVisita.update({
      where: { id: tipoVisitaId },
      data: { deletedAt: new Date() },
    });
  }

  async buscaExcluidos(estudoId: number) {
    return this.prisma.tipoVisita.findMany({
      where: { estudoId, deletedAt: { not: null } },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
  }

  async buscaPorIdComDeletado(tipoVisitaId: number) {
    return this.prisma.tipoVisita.findUnique({
      where: { id: tipoVisitaId },
    });
  }

  async restaura(tipoVisitaId: number) {
    return this.prisma.tipoVisita.update({
      where: { id: tipoVisitaId },
      data: { deletedAt: null },
    });
  }
}

export default TiposVisitaRepository;
