import { Prisma, StatusCandidato, StatusEstudo } from '@prisma/client';
import * as crypto from 'node:crypto';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import prisma from '../../../config/prisma';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import {
  AtualizarCandidatoInput,
  CampoTriagem,
  InscricaoPublicaInput,
  SalvarFormularioRecrutamentoInput,
} from '../schemas/recrutamento.schema';

class RecrutamentoService extends BaseService {
  private studyAuthorization = new StudyAuthorization();

  private validarStatusRecrutamento(status: StatusEstudo) {
    if (status !== StatusEstudo.PLANEJAMENTO && status !== StatusEstudo.EM_ANDAMENTO) {
      throw new AppError(
        'RECRUITMENT_CLOSED',
        'O recrutamento público está disponível apenas enquanto o estudo está em PLANEJAMENTO ou EM_ANDAMENTO.',
        HttpStatus.CONFLICT
      );
    }
  }

  async obterFormularioEstudo(userId: number, estudoId: number) {
    await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canView(userId, estudoId);

    return prisma.formularioRecrutamento.findUnique({
      where: { estudoId },
    });
  }

  async salvarFormulario(
    userId: number,
    estudoId: number,
    data: SalvarFormularioRecrutamentoInput
  ) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    this.validarStatusRecrutamento(estudo.status);

    const existente = await prisma.formularioRecrutamento.findUnique({ where: { estudoId } });

    if (existente) {
      return prisma.formularioRecrutamento.update({
        where: { estudoId },
        data: {
          ativo: data.ativo,
          titulo: data.titulo,
          descricao: data.descricao ?? null,
          camposTriagem: data.camposTriagem as unknown as Prisma.InputJsonValue,
        },
      });
    }

    const tokenPublico = crypto.randomBytes(16).toString('hex');

    return prisma.formularioRecrutamento.create({
      data: {
        estudoId,
        tokenPublico,
        ativo: data.ativo,
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        camposTriagem: data.camposTriagem as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async regenerarToken(userId: number, estudoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    this.validarStatusRecrutamento(estudo.status);

    const existente = await prisma.formularioRecrutamento.findUnique({ where: { estudoId } });
    if (!existente) {
      throw new AppError(
        'FORMULARIO_NOT_FOUND',
        'Formulário de recrutamento ainda não configurado para este estudo.',
        HttpStatus.NOT_FOUND
      );
    }

    return prisma.formularioRecrutamento.update({
      where: { estudoId },
      data: { tokenPublico: crypto.randomBytes(16).toString('hex') },
    });
  }

  // ==================== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ====================

  async obterFormularioPublico(tokenPublico: string) {
    const formulario = await prisma.formularioRecrutamento.findUnique({
      where: { tokenPublico },
      include: { estudo: true },
    });

    if (
      !formulario ||
      !formulario.ativo ||
      formulario.estudo.deletedAt !== null ||
      (formulario.estudo.status !== StatusEstudo.PLANEJAMENTO &&
        formulario.estudo.status !== StatusEstudo.EM_ANDAMENTO)
    ) {
      throw new AppError(
        'FORMULARIO_UNAVAILABLE',
        'Este formulário de inscrição não está disponível no momento.',
        HttpStatus.NOT_FOUND
      );
    }

    return {
      estudoNome: formulario.estudo.nome,
      estudoSigla: formulario.estudo.sigla,
      titulo: formulario.titulo,
      descricao: formulario.descricao,
      camposTriagem: (formulario.camposTriagem as unknown as CampoTriagem[]) ?? [],
    };
  }

  async registrarInscricaoPublica(tokenPublico: string, data: InscricaoPublicaInput) {
    const formulario = await prisma.formularioRecrutamento.findUnique({
      where: { tokenPublico },
      include: { estudo: true },
    });

    if (
      !formulario ||
      !formulario.ativo ||
      formulario.estudo.deletedAt !== null ||
      (formulario.estudo.status !== StatusEstudo.PLANEJAMENTO &&
        formulario.estudo.status !== StatusEstudo.EM_ANDAMENTO)
    ) {
      throw new AppError(
        'FORMULARIO_UNAVAILABLE',
        'Este formulário de inscrição não está disponível no momento.',
        HttpStatus.NOT_FOUND
      );
    }

    if (data.nascimento > new Date()) {
      throw new AppError(
        'INVALID_BIRTH_DATE',
        'A data de nascimento não pode ser futura.',
        HttpStatus.BAD_REQUEST
      );
    }

    const campos = (formulario.camposTriagem as unknown as CampoTriagem[]) ?? [];
    for (const campo of campos) {
      const resposta = data.respostasTriagem[campo.id];
      const vazia =
        resposta === undefined ||
        resposta === null ||
        resposta === '' ||
        (Array.isArray(resposta) && resposta.length === 0);

      if (campo.obrigatorio && vazia) {
        throw new AppError(
          'REQUIRED_FIELD_MISSING',
          `O campo obrigatório "${campo.label}" não foi preenchido.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const candidato = await prisma.candidatoEstudo.create({
      data: {
        estudoId: formulario.estudoId,
        formularioId: formulario.id,
        nome: data.nome,
        telefone: data.telefone ?? null,
        email: data.email ?? null,
        sexo: data.sexo,
        nascimento: data.nascimento,
        respostasTriagem: data.respostasTriagem as Prisma.InputJsonValue,
        status: StatusCandidato.PENDENTE,
      },
      select: {
        id: true,
        nome: true,
        status: true,
        createdAt: true,
      },
    });

    return candidato;
  }

  // ==================== GESTÃO DE CANDIDATOS PELA EQUIPE ====================

  async listarCandidatos(userId: number, estudoId: number, status?: StatusCandidato) {
    await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canView(userId, estudoId);

    return prisma.candidatoEstudo.findMany({
      where: {
        estudoId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async atualizarCandidato(
    userId: number,
    estudoId: number,
    candidatoId: number,
    data: AtualizarCandidatoInput
  ) {
    await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canLinkParticipant(userId, estudoId);

    const candidato = await prisma.candidatoEstudo.findFirst({
      where: { id: candidatoId, estudoId },
    });
    if (!candidato) {
      throw new AppError('CANDIDATO_NOT_FOUND', 'Candidato não encontrado neste estudo.', HttpStatus.NOT_FOUND);
    }

    return prisma.candidatoEstudo.update({
      where: { id: candidatoId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notasContato !== undefined ? { notasContato: data.notasContato ?? null } : {}),
      },
    });
  }

  async converterEmParticipante(userId: number, estudoId: number, candidatoId: number) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canLinkParticipant(userId, estudoId);
    await StudyStatusValidation.canCollectData(estudo);

    const candidato = await prisma.candidatoEstudo.findFirst({
      where: { id: candidatoId, estudoId },
    });
    if (!candidato) {
      throw new AppError('CANDIDATO_NOT_FOUND', 'Candidato não encontrado neste estudo.', HttpStatus.NOT_FOUND);
    }

    if (candidato.participanteId !== null) {
      throw new AppError(
        'CANDIDATO_ALREADY_CONVERTED',
        'Este candidato já foi convertido em participante do estudo.',
        HttpStatus.CONFLICT
      );
    }

    return prisma.$transaction(async (tx) => {
      const participante = await tx.participante.create({
        data: {
          nome: candidato.nome,
          telefone: candidato.telefone ?? null,
          sexo: candidato.sexo,
          nascimento: candidato.nascimento,
        },
      });

      const ultima = await tx.participacaoEstudo.findFirst({
        where: { estudoId },
        orderBy: { id: 'desc' },
        select: { codigo: true },
      });

      let proximoNumero = 1;
      if (ultima?.codigo) {
        const partes = ultima.codigo.split('-');
        const num = partes[1] ? parseInt(partes[1], 10) : NaN;
        if (Number.isFinite(num)) proximoNumero = num + 1;
      }
      const codigo = `${estudo.sigla}-${proximoNumero.toString().padStart(3, '0')}`;

      const participacao = await tx.participacaoEstudo.create({
        data: {
          estudoId,
          participanteId: participante.id,
          codigo,
        },
        include: { participante: true },
      });

      const candidatoAtualizado = await tx.candidatoEstudo.update({
        where: { id: candidatoId },
        data: {
          status: StatusCandidato.APROVADO,
          participanteId: participante.id,
        },
      });

      return { candidato: candidatoAtualizado, participacao };
    });
  }
}

export default RecrutamentoService;
