import { Estudo } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { CriarEstudoInput } from '../schemas/estudo.schema';

class EstudoRepository extends BaseRepository{
  async findByName(nome: string): Promise<Estudo | null> {
      return this.prisma.estudo.findFirst({ where: { nome, deletedAt: null } });
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
}

export default EstudoRepository;
