import { BaseRepository } from '../../../repositories/base.repository';

class ExportRepository extends BaseRepository {
  async buscarDadosDoEstudo(estudoId: number) {
    return this.prisma.estudo.findUnique({
      where: { id: estudoId },
      include: {
        grupos: {
          where: { deletedAt: null },
          orderBy: { id: 'asc' },
        },
        tipoVisitas: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        variaveis: {
          where: { deletedAt: null },
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        },
        participacoes: {
          where: { deletedAt: null },
          orderBy: { codigo: 'asc' },
          include: {
            participante: true,
            alocacao: {
              include: {
                grupoEstudo: true,
              },
            },
            visitas: {
              where: { deletedAt: null },
              include: {
                tipoVisita: true,
                medicoes: {
                  where: { deletedAt: null },
                  include: {
                    variavel: true,
                  },
                },
              },
              orderBy: { data: 'asc' },
            },
          },
        },
      },
    });
  }
}

export default ExportRepository;
