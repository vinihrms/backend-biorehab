import { StatusEstudo } from '@prisma/client';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import prisma from '../../../config/prisma';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import {
  AlocarEmLoteInput,
  AlocarParticipanteInput,
  AtualizarGrupoEstudoInput,
  AtualizarIntervencaoInput,
  CriarGrupoEstudoInput,
  CriarIntervencaoInput,
  QuebraEmergencialInput,
} from '../schemas/cegamento.schema';

class CegamentoService extends BaseService {
  private studyAuthorization = new StudyAuthorization();

  // ==================== GRUPOS DO ESTUDO ====================

  async listarGrupos(userId: number, estudoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canViewGroups(userId, estudo);

    return prisma.grupoEstudo.findMany({
      where: { estudoId, deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async criarGrupo(userId: number, estudoId: number, data: CriarGrupoEstudoInput) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await StudyStatusValidation.canEditStructure(estudo);

    const existente = await prisma.grupoEstudo.findFirst({
      where: { estudoId, nome: data.nome, deletedAt: null },
    });
    if (existente) {
      throw new AppError('GRUPO_ALREADY_EXISTS', 'Já existe um grupo com este nome no estudo.', HttpStatus.CONFLICT);
    }

    return prisma.grupoEstudo.create({
      data: {
        estudoId,
        nome: data.nome,
        descricaoMetodo: data.descricaoMetodo ?? null,
      },
    });
  }

  async atualizarGrupo(
    userId: number,
    estudoId: number,
    grupoId: number,
    data: AtualizarGrupoEstudoInput
  ) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await StudyStatusValidation.canEditStructure(estudo);

    const grupo = await prisma.grupoEstudo.findFirst({
      where: { id: grupoId, estudoId, deletedAt: null },
    });
    if (!grupo) {
      throw new AppError('GRUPO_NOT_FOUND', 'Grupo não encontrado neste estudo.', HttpStatus.NOT_FOUND);
    }

    if (data.nome && data.nome !== grupo.nome) {
      const conflito = await prisma.grupoEstudo.findFirst({
        where: { estudoId, nome: data.nome, deletedAt: null, id: { not: grupoId } },
      });
      if (conflito) {
        throw new AppError('GRUPO_ALREADY_EXISTS', 'Já existe um grupo com este nome no estudo.', HttpStatus.CONFLICT);
      }
    }

    return prisma.grupoEstudo.update({
      where: { id: grupoId },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.descricaoMetodo !== undefined ? { descricaoMetodo: data.descricaoMetodo ?? null } : {}),
      },
    });
  }

  async deletarGrupo(userId: number, estudoId: number, grupoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await StudyStatusValidation.canEditStructure(estudo);

    const grupo = await prisma.grupoEstudo.findFirst({
      where: { id: grupoId, estudoId, deletedAt: null },
    });
    if (!grupo) {
      throw new AppError('GRUPO_NOT_FOUND', 'Grupo não encontrado neste estudo.', HttpStatus.NOT_FOUND);
    }

    const totalAlocacoes = await prisma.alocacaoGrupo.count({ where: { grupoEstudoId: grupoId } });
    if (totalAlocacoes > 0) {
      throw new AppError(
        'GRUPO_HAS_ALLOCATIONS',
        'Não é possível remover um grupo que já possui voluntários alocados.',
        HttpStatus.CONFLICT
      );
    }

    await prisma.grupoEstudo.update({
      where: { id: grupoId },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== ALOCAÇÕES DE VOLUNTÁRIOS ====================

  async listarAlocacoes(userId: number, estudoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    const visibility = await this.studyAuthorization.getBlindingVisibility(userId, estudo);

    if (!visibility.canViewAll && !visibility.canViewOnlyUnblinded) {
      throw new AppError(
        'BLINDING_RESTRICTED',
        'As alocações de grupo estão ocultas para preservar o cegamento deste estudo.',
        HttpStatus.FORBIDDEN
      );
    }

    const alocacoes = await prisma.alocacaoGrupo.findMany({
      where: {
        participacaoEstudo: {
          estudoId,
          deletedAt: null,
        },
        ...(visibility.canViewOnlyUnblinded ? { quebradoEm: { not: null } } : {}),
      },
      include: {
        grupoEstudo: true,
        participacaoEstudo: {
          include: {
            participante: {
              select: { id: true, nome: true, sexo: true, nascimento: true },
            },
          },
        },
      },
      orderBy: {
        participacaoEstudo: { codigo: 'asc' },
      },
    });

    return {
      estudoCego: estudo.estudoCego,
      cegamentoQuebradoEm: estudo.cegamentoQuebradoEm,
      visibilidade: visibility.canViewAll ? 'COMPLETA' : 'PARCIAL_EMERGENCIAL',
      alocacoes,
    };
  }

  async alocarParticipante(userId: number, estudoId: number, data: AlocarParticipanteInput) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    const access = await this.studyAuthorization.canManageInterventions(userId, estudo);
    await StudyStatusValidation.canCollectData(estudo);

    const [participacao, grupo] = await Promise.all([
      prisma.participacaoEstudo.findFirst({
        where: { id: data.participacaoEstudoId, estudoId, deletedAt: null },
      }),
      prisma.grupoEstudo.findFirst({
        where: { id: data.grupoEstudoId, estudoId, deletedAt: null },
      }),
    ]);

    if (!participacao) {
      throw new AppError(
        'PARTICIPACAO_NOT_FOUND',
        'Participação não encontrada neste estudo.',
        HttpStatus.NOT_FOUND
      );
    }

    if (!grupo) {
      throw new AppError('GRUPO_NOT_FOUND', 'Grupo não encontrado neste estudo.', HttpStatus.NOT_FOUND);
    }

    return prisma.alocacaoGrupo.upsert({
      where: { participacaoEstudoId: participacao.id },
      create: {
        participacaoEstudoId: participacao.id,
        grupoEstudoId: grupo.id,
        alocadoPorId: access.usuario.id,
        alocadoPorNome: access.usuario.nome,
        observacoes: data.observacoes ?? null,
      },
      update: {
        grupoEstudoId: grupo.id,
        observacoes: data.observacoes ?? null,
      },
      include: {
        grupoEstudo: true,
        participacaoEstudo: { select: { id: true, codigo: true } },
      },
    });
  }

  async alocarEmLote(userId: number, estudoId: number, data: AlocarEmLoteInput) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    const access = await this.studyAuthorization.canManageInterventions(userId, estudo);
    await StudyStatusValidation.canCollectData(estudo);

    const [participacoes, grupos] = await Promise.all([
      prisma.participacaoEstudo.findMany({ where: { estudoId, deletedAt: null }, select: { id: true } }),
      prisma.grupoEstudo.findMany({ where: { estudoId, deletedAt: null }, select: { id: true } }),
    ]);

    const partIds = new Set(participacoes.map((p) => p.id));
    const grupoIds = new Set(grupos.map((g) => g.id));

    for (const item of data.alocacoes) {
      if (!partIds.has(item.participacaoEstudoId)) {
        throw new AppError(
          'PARTICIPACAO_NOT_FOUND',
          `Participação ID ${item.participacaoEstudoId} não pertence a este estudo.`,
          HttpStatus.BAD_REQUEST
        );
      }
      if (!grupoIds.has(item.grupoEstudoId)) {
        throw new AppError(
          'GRUPO_NOT_FOUND',
          `Grupo ID ${item.grupoEstudoId} não pertence a este estudo.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    return prisma.$transaction(
      data.alocacoes.map((item) =>
        prisma.alocacaoGrupo.upsert({
          where: { participacaoEstudoId: item.participacaoEstudoId },
          create: {
            participacaoEstudoId: item.participacaoEstudoId,
            grupoEstudoId: item.grupoEstudoId,
            alocadoPorId: access.usuario.id,
            alocadoPorNome: access.usuario.nome,
            observacoes: item.observacoes ?? null,
          },
          update: {
            grupoEstudoId: item.grupoEstudoId,
            observacoes: item.observacoes ?? null,
          },
          include: { grupoEstudo: true },
        })
      )
    );
  }

  // ==================== REVELAÇÃO FINAL & QUEBRA EMERGENCIAL ====================

  async revelarCegamentoEstudo(userId: number, estudoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canRevealBlinding(userId, estudoId);

    if (!estudo.estudoCego) {
      throw new AppError('STUDY_NOT_BLINDED', 'Este estudo não é um estudo cego.', HttpStatus.BAD_REQUEST);
    }

    if (estudo.cegamentoQuebradoEm !== null) {
      throw new AppError(
        'BLINDING_ALREADY_REVEALED',
        'O cegamento deste estudo já foi revelado anteriormente.',
        HttpStatus.CONFLICT
      );
    }

    if (
      estudo.status !== StatusEstudo.COLETA_ENCERRADA &&
      estudo.status !== StatusEstudo.ARQUIVADO
    ) {
      throw new AppError(
        'STUDY_COLLECTION_NOT_CLOSED',
        'A revelação completa do cegamento só pode ser feita após o encerramento da coleta (COLETA_ENCERRADA).',
        HttpStatus.CONFLICT
      );
    }

    const estudoAtualizado = await prisma.estudo.update({
      where: { id: estudoId },
      data: {
        cegamentoQuebradoEm: new Date(),
        cegamentoQuebradoPorId: userId,
      },
    });

    const grupos = await prisma.grupoEstudo.findMany({
      where: { estudoId, deletedAt: null },
      include: {
        _count: { select: { alocacoes: true, intervencoes: true } },
      },
    });

    return {
      estudo: estudoAtualizado,
      grupos,
    };
  }

  async quebraEmergencialIndividual(
    userId: number,
    estudoId: number,
    participacaoId: number,
    data: QuebraEmergencialInput
  ) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    const access = await this.studyAuthorization.canRevealBlinding(userId, estudoId);

    if (!estudo.estudoCego) {
      throw new AppError('STUDY_NOT_BLINDED', 'Este estudo não é um estudo cego.', HttpStatus.BAD_REQUEST);
    }

    if (estudo.cegamentoQuebradoEm !== null) {
      throw new AppError(
        'BLINDING_ALREADY_REVEALED',
        'O cegamento completo deste estudo já foi revelado.',
        HttpStatus.CONFLICT
      );
    }

    const participacao = await prisma.participacaoEstudo.findFirst({
      where: { id: participacaoId, estudoId, deletedAt: null },
      include: { alocacao: true },
    });

    if (!participacao) {
      throw new AppError(
        'PARTICIPACAO_NOT_FOUND',
        'Participação não encontrada neste estudo.',
        HttpStatus.NOT_FOUND
      );
    }

    if (!participacao.alocacao) {
      throw new AppError(
        'ALLOCATION_NOT_FOUND',
        'Este voluntário ainda não foi alocado a nenhum grupo.',
        HttpStatus.NOT_FOUND
      );
    }

    if (participacao.alocacao.quebradoEm !== null) {
      throw new AppError(
        'INDIVIDUAL_UNBLINDING_ALREADY_DONE',
        'O cegamento deste voluntário já foi quebrado anteriormente.',
        HttpStatus.CONFLICT
      );
    }

    return prisma.alocacaoGrupo.update({
      where: { id: participacao.alocacao.id },
      data: {
        quebradoEm: new Date(),
        quebradoPorId: access.usuario.id,
        quebradoPorNome: access.usuario.nome,
        motivoQuebra: data.motivo,
      },
      include: {
        grupoEstudo: true,
        participacaoEstudo: {
          include: {
            participante: { select: { id: true, nome: true } },
          },
        },
      },
    });
  }

  // ==================== REGISTROS DE INTERVENÇÃO ====================

  async listarIntervencoes(userId: number, participacaoId: number) {
    const participacao = await prisma.participacaoEstudo.findFirst({
      where: { id: participacaoId, deletedAt: null },
      include: { estudo: true, alocacao: true },
    });

    if (!participacao) {
      throw new AppError('PARTICIPACAO_NOT_FOUND', 'Participação não encontrada.', HttpStatus.NOT_FOUND);
    }

    const visibility = await this.studyAuthorization.getBlindingVisibility(userId, participacao.estudo);
    const liberadoPorEmergencia =
      visibility.canViewOnlyUnblinded && Boolean(participacao.alocacao?.quebradoEm);

    if (!visibility.canViewAll && !liberadoPorEmergencia) {
      throw new AppError(
        'BLINDING_RESTRICTED',
        'Registros de intervenção estão ocultos para preservar o cegamento deste estudo.',
        HttpStatus.FORBIDDEN
      );
    }

    return prisma.registroIntervencao.findMany({
      where: { participacaoEstudoId: participacaoId, deletedAt: null },
      include: { grupoEstudo: true },
      orderBy: { data: 'asc' },
    });
  }

  async criarIntervencao(userId: number, participacaoId: number, data: CriarIntervencaoInput) {
    const participacao = await prisma.participacaoEstudo.findFirst({
      where: { id: participacaoId, deletedAt: null },
      include: { estudo: true, alocacao: true },
    });

    if (!participacao) {
      throw new AppError('PARTICIPACAO_NOT_FOUND', 'Participação não encontrada.', HttpStatus.NOT_FOUND);
    }

    const access = await this.studyAuthorization.canManageInterventions(userId, participacao.estudo);
    await StudyStatusValidation.canCollectData(participacao.estudo);

    if (!participacao.alocacao) {
      throw new AppError(
        'ALLOCATION_REQUIRED',
        'Aloque o voluntário a um grupo antes de registrar intervenções.',
        HttpStatus.BAD_REQUEST
      );
    }

    return prisma.registroIntervencao.create({
      data: {
        participacaoEstudoId: participacaoId,
        grupoEstudoId: participacao.alocacao.grupoEstudoId,
        data: data.data,
        realizadoPor: access.usuario.nome,
        notas: data.notas ?? null,
      },
      include: { grupoEstudo: true },
    });
  }

  async atualizarIntervencao(
    userId: number,
    participacaoId: number,
    intervencaoId: number,
    data: AtualizarIntervencaoInput
  ) {
    const participacao = await prisma.participacaoEstudo.findFirst({
      where: { id: participacaoId, deletedAt: null },
      include: { estudo: true },
    });

    if (!participacao) {
      throw new AppError('PARTICIPACAO_NOT_FOUND', 'Participação não encontrada.', HttpStatus.NOT_FOUND);
    }

    await this.studyAuthorization.canManageInterventions(userId, participacao.estudo);

    const intervencao = await prisma.registroIntervencao.findFirst({
      where: { id: intervencaoId, participacaoEstudoId: participacaoId, deletedAt: null },
    });

    if (!intervencao) {
      throw new AppError('INTERVENCAO_NOT_FOUND', 'Registro de intervenção não encontrado.', HttpStatus.NOT_FOUND);
    }

    return prisma.registroIntervencao.update({
      where: { id: intervencaoId },
      data: {
        ...(data.data !== undefined ? { data: data.data } : {}),
        ...(data.notas !== undefined ? { notas: data.notas ?? null } : {}),
      },
      include: { grupoEstudo: true },
    });
  }

  async deletarIntervencao(userId: number, participacaoId: number, intervencaoId: number) {
    const participacao = await prisma.participacaoEstudo.findFirst({
      where: { id: participacaoId, deletedAt: null },
      include: { estudo: true },
    });

    if (!participacao) {
      throw new AppError('PARTICIPACAO_NOT_FOUND', 'Participação não encontrada.', HttpStatus.NOT_FOUND);
    }

    await this.studyAuthorization.canManageInterventions(userId, participacao.estudo);

    const intervencao = await prisma.registroIntervencao.findFirst({
      where: { id: intervencaoId, participacaoEstudoId: participacaoId, deletedAt: null },
    });

    if (!intervencao) {
      throw new AppError('INTERVENCAO_NOT_FOUND', 'Registro de intervenção não encontrado.', HttpStatus.NOT_FOUND);
    }

    await prisma.registroIntervencao.update({
      where: { id: intervencaoId },
      data: { deletedAt: new Date() },
    });
  }
}

export default CegamentoService;
