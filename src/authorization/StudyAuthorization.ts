import { Papel, type Usuario } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../utils/http-status';
import PermissaoEstudoRepository from '../modules/permissao_estudos/repositories/PermissaoEstudoRepository';
import UsuarioRepository from '../modules/usuarios/repositories/UsuarioRepository';
import EstudoRepository from '../modules/estudos/repositories/EstudoRepository';

type StudyAccess = {
  usuario: Usuario;
  papel?: Papel;
};

class StudyAuthorization {
  private usuarioRepository = new UsuarioRepository();
  private estudoRepository = new EstudoRepository();
  private permissaoEstudoRepository = new PermissaoEstudoRepository();

  private async getUserOrFail(userId: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(userId);

    if (!usuario) {
      throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
    }

    return usuario;
  }

  async estudoExiste(estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }
        return estudo;
    }

  private async getAccess(userId: number, estudoId: number): Promise<StudyAccess> {
    const usuario = await this.getUserOrFail(userId);

    if (usuario.isAdmin) {
      return { usuario };
    }

    const permissao = await this.permissaoEstudoRepository.findByUsuarioAndEstudo(userId, estudoId);

    if (permissao?.papel) {
      return { usuario, papel: permissao.papel };
    }

    return { usuario };
  }

  async canView(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (access.usuario.isAdmin) {
      return access;
    }

    if (!access.papel) {
      throw new AppError('FORBIDDEN', 'Você não tem acesso a este estudo.', HttpStatus.FORBIDDEN);
    }

    return access;
  }

  async canManageStudy(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (access.usuario.isAdmin || access.papel === Papel.owner) {
      return access;
    }

    throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', HttpStatus.FORBIDDEN);
  }

  async canManagePermissions(userId: number, estudoId: number): Promise<StudyAccess> {
    return this.canManageStudy(userId, estudoId);
  }

  async canLinkParticipant(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (access.usuario.isAdmin || access.papel === Papel.owner || access.papel === Papel.collector) {
      return access;
    }

    throw new AppError('FORBIDDEN', 'Você não tem permissão para vincular participantes a este estudo.', HttpStatus.FORBIDDEN);
  }
}

export default StudyAuthorization;
