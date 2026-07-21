import { TipoVisitaOmit } from './../../../../node_modules/.prisma/client/index.d';
import { Prisma, ParticipacaoEstudo, Participante } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarTipoVisita, CriarTipoVisitaInput } from '../schemas/tipos_visita.schema';

class TiposVisitaRepository extends BaseRepository {

  async listaTodosPorEstudo(estudoId: number) {
    return this.prisma.tipoVisita.findMany({
      where: {
        estudoId, deletedAt: null
      }
    })
  }

  async findByName(estudoId: number, nome: string) {
    return this.prisma.tipoVisita.findFirst({
      where: {
        estudoId,
        nome,
        deletedAt: null,
      },
    });
  }

  async criar(estudoId: number, data: CriarTipoVisitaInput) {
    return this.prisma.tipoVisita.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        estudoId,
      },
    });
  }

  async buscaPorId(estudoId: number, tipoVisitaId: number) {
    return this.prisma.tipoVisita.findFirst({
      where: {
        estudoId,
        id: tipoVisitaId,
        deletedAt: null,
      },
    });
  }

  async update(tipoVisitaId: number, data: atualizarTipoVisita) {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      updateData.nome = data.nome;
    }

    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }

    return this.prisma.tipoVisita.update({
      where: {
        id: tipoVisitaId
      },
      data: updateData,
    });
  }

  async apaga(tipoVisitaId: number) {
    return this.prisma.tipoVisita.update({
      where: {
        id: tipoVisitaId
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async buscaExcluidos(estudoId: number) {
    return this.prisma.tipoVisita.findFirst({
      where: {
        estudoId,
        deletedAt: {not: null},
      },
    });
  }

  async buscaPorIdComDeletado(tipoVisitaId: number){
    return this.prisma.tipoVisita.findUnique({
      where: {
        id: tipoVisitaId
      }
    });
  }

  async restaura(tipoVisitaId: number){
    return this.prisma.tipoVisita.update({
      where: {
        id: tipoVisitaId
      },
      data: {
        deletedAt: null
      }
    });
  }
}

export default TiposVisitaRepository;
