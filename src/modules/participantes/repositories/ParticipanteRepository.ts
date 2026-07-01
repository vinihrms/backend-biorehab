import { Prisma, ParticipacaoEstudo, Participante } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarParticipanteSchema, CriarParticipanteInput, criarParticipanteSchema } from '../schemas/participante.schema';

class ParticipanteRepository extends BaseRepository {

  async findByName(nome: string): Promise<Participante | null> {
    return this.prisma.participante.findFirst({ where: { name: nome, deletedAt: null } });
  }

  async create(data: CriarParticipanteInput) {
    return this.prisma.participante.create({
      data: {
        name: data.name,
        telefone: data.telefone,
        sexo: data.sexo,
        nascimento: data.nascimento,
      }
    });
  }

  async findAll(): Promise<Participante[]> {
    return this.prisma.participante.findMany({ where: { deletedAt: null } });
  }

  async findById(participanteId: number): Promise<Participante | null> {
    return this.prisma.participante.findFirst({ where: { id: participanteId, deletedAt: null } })
  }

  async update(participanteId: number, data: atualizarParticipanteSchema) {
    const updateData: Prisma.ParticipanteUpdateInput = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.sexo !== undefined) {
      updateData.sexo = data.sexo;
    }
    if (data.nascimento !== undefined) {
      updateData.nascimento = data.nascimento;
    }
    if (data.telefone !== undefined) {
      updateData.telefone = data.telefone;
    }

    return this.prisma.participante.update({
      where: {
        id: participanteId,
      },
      data: updateData,
    });

  }

  async softDelete(participanteId: number) {
    return this.prisma.participante.update({
      where: {
        id: participanteId
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async findAllExcluidos(): Promise<Participante[]> {
    return this.prisma.participante.findMany({ where: { deletedAt: { not: null } } });
  }

  async restaura(participanteId: number) {
    return this.prisma.participante.update({
      where: {
        id: participanteId
      },
      data: {
        deletedAt: null
      }
    });
  }

   async findByIdIncludingDeleted(participanteId: number): Promise<Participante | null> {
    return this.prisma.participante.findUnique({
      where: {
        id: participanteId
      }
    });
  }

}
export default ParticipanteRepository;
