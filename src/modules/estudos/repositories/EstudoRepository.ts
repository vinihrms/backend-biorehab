import { Estudo, Papel } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { AtualizarEstudoInput, CriarEstudoInput } from '../schemas/estudo.schema';

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
}

export default EstudoRepository;
