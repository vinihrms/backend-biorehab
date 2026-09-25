import { Prisma, Usuario } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';

const usuarioPublicSelect = {
  id: true,
  email: true,
  ra: true,
  nome: true,
  isActive: true,
  isAdmin: true,
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

  async findAll(): Promise<UsuarioPublic[]> {
    return this.prisma.usuario.findMany({
      select: usuarioPublicSelect,
      orderBy: { nome: 'asc' },
    });
  }

  async findPublicById(id: number): Promise<UsuarioPublic | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: usuarioPublicSelect,
    });
  }

  async findByEmailOrRaExceptId(email: string, ra: string, id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({
      where: {
        id: { not: id },
        OR: [{ email }, { ra }],
      },
    });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<UsuarioPublic> {
    return this.prisma.usuario.create({
      data,
      select: usuarioPublicSelect,
    });
  }

  async update(id: number, data: Prisma.UsuarioUpdateInput): Promise<UsuarioPublic> {
    return this.prisma.usuario.update({
      where: { id },
      data,
      select: usuarioPublicSelect,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}

export default UsuarioRepository;
