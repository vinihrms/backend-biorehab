import { Papel, StatusCandidato, StatusEstudo } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';

export type AccessibleStudyRow = {
  id: number;
  nome: string;
  sigla: string;
  status: StatusEstudo;
  estudoCego: boolean;
  cegamentoQuebradoEm: Date | null;
  meuPapel: Papel | null;
};

type DashboardAggregateParams = {
  isAdmin: boolean;
  studyIds: number[];
  linkableStudyIds: number[];
  planningManagedStudyIds: number[];
  sevenDaysAgo: Date;
};

class DashboardRepository extends BaseRepository {
  /**
   * Lista os estudos ativos acessíveis ao usuário com os metadados mínimos
   * necessários para calcular os blocos do dashboard.
   */
  async findAccessibleStudies(userId: number, isAdmin: boolean): Promise<AccessibleStudyRow[]> {
    const estudos = await this.prisma.estudo.findMany({
      where: {
        deletedAt: null,
        ...(!isAdmin
          ? {
              permissoes: {
                some: {
                  usuarioId: userId,
                  deletedAt: null,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
        status: true,
        estudoCego: true,
        cegamentoQuebradoEm: true,
        permissoes: {
          where: {
            usuarioId: userId,
            deletedAt: null,
          },
          select: {
            papel: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return estudos.map(({ permissoes, ...estudo }) => ({
      ...estudo,
      meuPapel: permissoes[0]?.papel ?? null,
    }));
  }

  /**
   * Executa em paralelo todas as consultas agregadas e a atividade recente
   * respeitando escopo do usuário, regras de cegamento e soft-delete.
   */
  async getDashboardMetrics(params: DashboardAggregateParams) {
    const { isAdmin, studyIds, linkableStudyIds, planningManagedStudyIds, sevenDaysAgo } = params;
    const hasStudies = studyIds.length > 0;

    const [
      participantesBaseTotal,
      visitasUltimos7Dias,
      medicoesUltimos7Dias,
      usuariosPendentes,
      candidatosAgrupados,
      variaveisAgrupadas,
      tiposVisitaAgrupados,
      ultimasVisitasRaw,
    ] = await Promise.all([
      this.prisma.participante.count({
        where: { deletedAt: null },
      }),
      hasStudies
        ? this.prisma.visita.count({
            where: {
              deletedAt: null,
              createdAt: { gte: sevenDaysAgo },
              tipoVisita: { deletedAt: null },
              participacaoEstudo: {
                deletedAt: null,
                estudoId: { in: studyIds },
                participante: { deletedAt: null },
              },
            },
          })
        : Promise.resolve(0),
      hasStudies
        ? this.prisma.medicao.count({
            where: {
              deletedAt: null,
              createdAt: { gte: sevenDaysAgo },
              variavel: { deletedAt: null },
              visita: {
                deletedAt: null,
                tipoVisita: { deletedAt: null },
                participacaoEstudo: {
                  deletedAt: null,
                  estudoId: { in: studyIds },
                  participante: { deletedAt: null },
                },
              },
            },
          })
        : Promise.resolve(0),
      isAdmin
        ? this.prisma.usuario.count({
            where: {
              isActive: false,
              deletedAt: null,
            },
          })
        : Promise.resolve(null),
      linkableStudyIds.length > 0
        ? this.prisma.candidatoEstudo.groupBy({
            by: ['estudoId'],
            where: {
              estudoId: { in: linkableStudyIds },
              status: StatusCandidato.PENDENTE,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      planningManagedStudyIds.length > 0
        ? this.prisma.variavel.groupBy({
            by: ['estudoId'],
            where: {
              estudoId: { in: planningManagedStudyIds },
              deletedAt: null,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      planningManagedStudyIds.length > 0
        ? this.prisma.tipoVisita.groupBy({
            by: ['estudoId'],
            where: {
              estudoId: { in: planningManagedStudyIds },
              deletedAt: null,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      hasStudies
        ? this.prisma.visita.findMany({
            where: {
              deletedAt: null,
              tipoVisita: { deletedAt: null },
              participacaoEstudo: {
                deletedAt: null,
                estudoId: { in: studyIds },
                participante: { deletedAt: null },
                estudo: { deletedAt: null },
              },
            },
            orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
            take: 6,
            select: {
              id: true,
              data: true,
              tipoVisita: {
                select: {
                  nome: true,
                },
              },
              participacaoEstudo: {
                select: {
                  estudoId: true,
                  participanteId: true,
                  codigo: true,
                  estudo: {
                    select: {
                      sigla: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      participantesBaseTotal,
      visitasUltimos7Dias,
      medicoesUltimos7Dias,
      usuariosPendentes,
      candidatosAgrupados,
      variaveisAgrupadas,
      tiposVisitaAgrupados,
      ultimasVisitasRaw,
    };
  }
}

export default DashboardRepository;
