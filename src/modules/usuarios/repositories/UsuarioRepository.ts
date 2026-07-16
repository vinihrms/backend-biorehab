import { Prisma, Usuario } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';

const usuarioPublicSelect = {
  id: true,
  email: true,
  ra: true,
  nome: true,
  createdAt: true,
} satisfies Prisma.UsuarioSelect;

export type UsuarioPublic = Prisma.UsuarioGetPayload<{ select: typeof usuarioPublicSelect }>;

class UsuarioRepository extends BaseRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async findByEmailOrRa(email: string, ra: string): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({
      where: { OR: [{ email }, { ra }] },
    });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<UsuarioPublic> {
    return this.prisma.usuario.create({
      data,
      select: usuarioPublicSelect,
    });
  }
}

export default UsuarioRepository;
