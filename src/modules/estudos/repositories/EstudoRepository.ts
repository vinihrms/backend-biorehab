import { Estudo } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { AtualizarEstudoInput, CriarEstudoInput } from '../schemas/estudo.schema';
import { number } from 'zod';

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
        sigla: data.sigla ?? null,
        descricao: data.descricao ?? null,
      }
    });
  }

  async findAll(): Promise<Estudo[]> {
    return this.prisma.estudo.findMany({ where: { deletedAt: null } });
  }

  async findById(estudoId: number): Promise<Estudo | null> {
    return this.prisma.estudo.findFirst({ where: { id: estudoId, deletedAt: null } })
  }

  async update(estudoId: number, data: AtualizarEstudoInput) {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      updateData.nome = data.nome;
    }

    if (data.sigla !== undefined) {
      updateData.sigla = data.sigla;
    }

    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }

    return this.prisma.estudo.update({
      where: {
        id: estudoId,
      },
      data: updateData,
    });
  }


}

export default EstudoRepository;
