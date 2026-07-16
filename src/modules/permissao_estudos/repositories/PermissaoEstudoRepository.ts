import { Estudo, PermissaoEstudo } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { number } from 'zod';
import { Papel } from '@prisma/client';
import { AtualizarPermissaoEstudoInput } from '../schemas/permissao_estudo.schema';
class PermissaoEstudoRepository extends BaseRepository {
  async create(estudoId: number, usuarioId: number, papel: Papel) {
    return this.prisma.permissaoEstudo.create({
      data: {
        estudoId: estudoId,
        usuarioId: usuarioId,
        papel: papel
      }
    })
  }

  async findAll(estudoId: number) {
    return this.prisma.permissaoEstudo.findMany({
      where: {
        estudoId,
      },
      include: {
        usuario: {
          select: {
            ra: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }

  async findByUsuarioAndEstudo(usuarioId: number, estudoId: number) {
    return this.prisma.permissaoEstudo.findFirst({
      where: {
        usuarioId,
        estudoId,
      },
    });
  }

  async atualizar(
    estudoId: number,
    usuarioId: number,
    data: AtualizarPermissaoEstudoInput
  ) {
    return this.prisma.permissaoEstudo.update({
      where: {
        estudoId_usuarioId: {
          estudoId,
          usuarioId,
        },
      },
      data: {
        papel: data.papel,
      },
    });
  }

  async hardDelete(estudoId: number, usuarioId: number) {
  return this.prisma.permissaoEstudo.delete({
    where: {
      estudoId_usuarioId: {
        estudoId,
        usuarioId,
      },
    },
  });
}

}

export default PermissaoEstudoRepository;
