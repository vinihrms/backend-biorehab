import { Estudo, Papel, StatusCandidato } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { AtualizarEstudoInput, CriarEstudoInput } from '../schemas/estudo.schema';

export type EstudoResumo = {
  participacoesAtivas: number;
  visitasAtivas: number;
  candidatosPendentes: number;
  ultimaVisitaEm: Date | null;
};

class EstudoRepository extends BaseRepository {
  async findByName(nome: string): Promise<Estudo | null> {
    return this.prisma.estudo.findFirst({ where: { nome, deletedAt: null } });
  }

  async findBySigla(sigla: string): Promise<Estudo | null> {
    return this.prisma.estudo.findFirst({ where: { sigla, deletedAt: null } });
  }

  async create(data: CriarEstudoInput) {
    return this.prisma.estudo.create({
      data: {
        nome: data.nome,
        sigla: data.sigla,
        descricao: data.descricao ?? null,
        metaParticipantes: data.metaParticipantes ?? null,
        estudoCego: data.estudoCego ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.estudo.findMany({
      where: { deletedAt: null },
      include: {
        variaveis: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        tipoVisitas: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        permissoes: {
          where: { deletedAt: null },
          include: {
            usuario: {
              select: {
                nome: true,
                ra: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllByUsario(userId: number) {
    return this.prisma.estudo.findMany({
      where: {
        permissoes: {
          some: {
            usuarioId: userId,
            deletedAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        variaveis: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        tipoVisitas: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        participacoes: {
          where: { deletedAt: null },
        },
        permissoes: {
          where: {
            usuarioId: userId,
            deletedAt: null,
          },
          select: {
            id: true,
            usuarioId: true,
            estudoId: true,
            papel: true,
          },
        },
      },
    });
  }

  async findById(estudoId: number): Promise<Estudo | null> {
    return this.prisma.estudo.findFirst({ where: { id: estudoId, deletedAt: null } });
  }

  async update(estudoId: number, data: AtualizarEstudoInput) {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.sigla !== undefined) updateData.sigla = data.sigla;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.metaParticipantes !== undefined) updateData.metaParticipantes = data.metaParticipantes;
    if (data.estudoCego !== undefined) updateData.estudoCego = data.estudoCego;

    return this.prisma.estudo.update({
      where: { id: estudoId },
      data: updateData,
    });
  }

  async softDelete(estudoId: number) {
    return this.prisma.estudo.update({
      where: { id: estudoId },
      data: { deletedAt: new Date() },
    });
  }

  async findByIdIncludingDeleted(estudoId: number): Promise<Estudo | null> {
    return this.prisma.estudo.findUnique({
      where: { id: estudoId },
    });
  }

  async findAllExcluidos(): Promise<Estudo[]> {
    return this.prisma.estudo.findMany({ where: { deletedAt: { not: null } } });
  }

  async findAllExcluidosByUser(userId: number): Promise<Estudo[]> {
    return this.prisma.estudo.findMany({
      where: {
        deletedAt: { not: null },
        permissoes: {
          some: {
            usuarioId: userId,
            deletedAt: null,
            papel: { in: [Papel.owner, Papel.study_admin] },
          },
        },
      },
    });
  }

  async restaura(estudoId: number) {
    return this.prisma.estudo.update({
      where: { id: estudoId },
      data: { deletedAt: null },
    });
  }

  /**
   * Calcula os contadores resumidos de uma lista de estudos em lote (sem N+1),
   * respeitando soft-delete em todas as entidades envolvidas.
   */
  async getResumosPorEstudos(
    studyIds: number[],
    tipoVisitaToEstudo: Map<number, number>
  ): Promise<Map<number, EstudoResumo>> {
    const resumos = new Map<number, EstudoResumo>();
    for (const studyId of studyIds) {
      resumos.set(studyId, {
        participacoesAtivas: 0,
        visitasAtivas: 0,
        candidatosPendentes: 0,
        ultimaVisitaEm: null,
      });
    }

    if (studyIds.length === 0) {
      return resumos;
    }

    const [participacoesAgrupadas, visitasAgrupadas, candidatosAgrupados] = await Promise.all([
      this.prisma.participacaoEstudo.groupBy({
        by: ['estudoId'],
        where: {
          estudoId: { in: studyIds },
          deletedAt: null,
          participante: { deletedAt: null },
        },
        _count: { _all: true },
      }),
      this.prisma.visita.groupBy({
        by: ['tipoVisitaId'],
        where: {
          deletedAt: null,
          tipoVisita: {
            deletedAt: null,
            estudoId: { in: studyIds },
          },
          participacaoEstudo: {
            deletedAt: null,
            estudoId: { in: studyIds },
            participante: { deletedAt: null },
          },
        },
        _count: { _all: true },
        _max: { data: true },
      }),
      this.prisma.candidatoEstudo.groupBy({
        by: ['estudoId'],
        where: {
          estudoId: { in: studyIds },
          status: StatusCandidato.PENDENTE,
        },
        _count: { _all: true },
      }),
    ]);

    for (const row of participacoesAgrupadas) {
      const resumo = resumos.get(row.estudoId);
      if (resumo) {
        resumo.participacoesAtivas = row._count._all;
      }
    }

    for (const row of visitasAgrupadas) {
      const estudoId = tipoVisitaToEstudo.get(row.tipoVisitaId);
      if (estudoId === undefined) continue;
      const resumo = resumos.get(estudoId);
      if (!resumo) continue;

      resumo.visitasAtivas += row._count._all;
      const maxData = row._max.data;
      if (maxData && (!resumo.ultimaVisitaEm || maxData > resumo.ultimaVisitaEm)) {
        resumo.ultimaVisitaEm = maxData;
      }
    }

    for (const row of candidatosAgrupados) {
      const resumo = resumos.get(row.estudoId);
      if (resumo) {
        resumo.candidatosPendentes = row._count._all;
      }
    }

    return resumos;
  }
}

export default EstudoRepository;
