import { Prisma, Usuario } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';

const usuarioPublicSelect = {
  id: true,
  email: true,
  ra: true,
  nome: true,
  isActive: true,
  isAdmin: true,
  canCreateStudy: true,
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

  async buscarAtivos(termo?: string) {
    const q = termo?.trim();
    return this.prisma.usuario.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { nome: { contains: q } },
                { email: { contains: q } },
                { ra: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ra: true,
      },
      orderBy: { nome: 'asc' },
      take: 50,
    });
  }

  async podeGerenciarAlgumEstudo(userId: number): Promise<boolean> {
    const count = await this.prisma.permissaoEstudo.count({
      where: {
        usuarioId: userId,
        deletedAt: null,
        papel: { in: ['owner', 'study_admin'] },
      },
    });
    return count > 0;
  }
}

export default UsuarioRepository;
