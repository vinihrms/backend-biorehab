import { Papel, StatusEstudo, type Estudo, type Usuario } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../utils/http-status';
import PermissaoEstudoRepository from '../modules/permissao_estudos/repositories/PermissaoEstudoRepository';
import UsuarioRepository from '../modules/usuarios/repositories/UsuarioRepository';
import EstudoRepository from '../modules/estudos/repositories/EstudoRepository';

export type StudyAccess = {
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

  async estudoExiste(estudoId: number): Promise<Estudo> {
    const estudo = await this.estudoRepository.findById(estudoId);
    if (!estudo) {
      throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
    }
    return estudo;
  }

  async getAccess(userId: number, estudoId: number): Promise<StudyAccess> {
    const usuario = await this.getUserOrFail(userId);
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

    if (
      access.usuario.isAdmin ||
      access.papel === Papel.owner ||
      access.papel === Papel.study_admin
    ) {
      return access;
    }

    throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', HttpStatus.FORBIDDEN);
  }

  async canManagePermissions(userId: number, estudoId: number): Promise<StudyAccess> {
    return this.canManageStudy(userId, estudoId);
  }

  async canLinkParticipant(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (
      access.usuario.isAdmin ||
      access.papel === Papel.owner ||
      access.papel === Papel.study_admin ||
      access.papel === Papel.collector ||
      access.papel === Papel.interventionist
    ) {
      return access;
    }

    throw new AppError(
      'FORBIDDEN',
      'Você não tem permissão para vincular participantes a este estudo.',
      HttpStatus.FORBIDDEN
    );
  }

  async canCollectMeasurements(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (
      access.usuario.isAdmin ||
      access.papel === Papel.owner ||
      access.papel === Papel.study_admin ||
      access.papel === Papel.collector
    ) {
      return access;
    }

    throw new AppError(
      'FORBIDDEN',
      'Seu papel neste estudo não permite registrar ou editar visitas e medições de avaliação.',
      HttpStatus.FORBIDDEN
    );
  }

  /**
   * Em estudos cegos, apenas o papel `interventionist` pode gerenciar alocações e intervenções.
   * Nem `isAdmin` nem `owner` têm permissão automática para evitar quebra acidental de cegamento.
   * Em estudos não cegos, `owner`, `study_admin`, `interventionist` e `isAdmin` podem gerenciar.
   */
  async canManageInterventions(userId: number, estudo: Estudo): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudo.id);

    if (estudo.estudoCego) {
      if (access.papel === Papel.interventionist) {
        return access;
      }

      throw new AppError(
        'BLINDING_RESTRICTED',
        'Acesso restrito ao intervencionista para preservar o cegamento deste estudo.',
        HttpStatus.FORBIDDEN
      );
    }

    if (
      access.usuario.isAdmin ||
      access.papel === Papel.owner ||
      access.papel === Papel.study_admin ||
      access.papel === Papel.interventionist
    ) {
      return access;
    }

    throw new AppError(
      'FORBIDDEN',
      'Você não tem permissão para gerenciar intervenções neste estudo.',
      HttpStatus.FORBIDDEN
    );
  }

  /**
   * Apenas `owner` ou `isAdmin` podem revelar o cegamento (final ou quebra emergencial individual).
   */
  async canRevealBlinding(userId: number, estudoId: number): Promise<StudyAccess> {
    const access = await this.getAccess(userId, estudoId);

    if (access.usuario.isAdmin || access.papel === Papel.owner) {
      return access;
    }

    throw new AppError(
      'FORBIDDEN',
      'Apenas o proprietário do estudo ou o administrador podem revelar o cegamento.',
      HttpStatus.FORBIDDEN
    );
  }

  /**
   * Em estudos cegos (antes da revelação oficial), protege a visualização dos grupos e
   * descrições de método:
   * - `interventionist` sempre pode visualizar os grupos para executar o protocolo.
   * - `owner`, `study_admin` e `isAdmin` podem visualizar durante `PLANEJAMENTO` (para configurar os grupos).
   * - `collector` e `viewer` nunca visualizam enquanto o cegamento estiver ativo;
   *   gestores também deixam de visualizar os grupos/métodos após iniciar a coleta até a revelação final.
   */
  async canViewGroups(userId: number, estudo: Estudo): Promise<StudyAccess> {
    const access = await this.canView(userId, estudo.id);

    if (!estudo.estudoCego || estudo.cegamentoQuebradoEm !== null) {
      return access;
    }

    if (access.papel === Papel.interventionist) {
      return access;
    }

    if (
      estudo.status === StatusEstudo.PLANEJAMENTO &&
      (access.usuario.isAdmin ||
        access.papel === Papel.owner ||
        access.papel === Papel.study_admin)
    ) {
      return access;
    }

    throw new AppError(
      'BLINDING_RESTRICTED',
      'Os grupos e protocolos de intervenção estão ocultos para preservar o cegamento deste estudo.',
      HttpStatus.FORBIDDEN
    );
  }

  /**
   * Determina o nível de visibilidade do usuário sobre alocações/intervenções de um estudo.
   * - `canViewAll`: vê todos os grupos/alocações/intervenções (estudo aberto, cegamento revelado ou usuário é `interventionist`)
   * - `canViewOnlyUnblinded`: apenas `owner` ou `isAdmin` em estudo cego ativo — vê somente voluntários com quebra emergencial individual
   * - ambos `false`: `collector`, `viewer` e `study_admin` em estudo cego ativo — totalmente cegados
   */
  async getBlindingVisibility(userId: number, estudo: Estudo): Promise<{
    access: StudyAccess;
    canViewAll: boolean;
    canViewOnlyUnblinded: boolean;
  }> {
    const access = await this.canView(userId, estudo.id);

    if (!estudo.estudoCego || estudo.cegamentoQuebradoEm !== null) {
      return { access, canViewAll: true, canViewOnlyUnblinded: false };
    }

    if (access.papel === Papel.interventionist) {
      return { access, canViewAll: true, canViewOnlyUnblinded: false };
    }

    if (access.usuario.isAdmin || access.papel === Papel.owner) {
      return { access, canViewAll: false, canViewOnlyUnblinded: true };
    }

    return { access, canViewAll: false, canViewOnlyUnblinded: false };
  }
}

export default StudyAuthorization;
