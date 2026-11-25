import { DataType, Variavel } from '@prisma/client';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { parseVariableOptions, serializeVariableOptions } from '../../../utils/choice-options';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import FormulaEvaluationService from '../../medicoes/services/FormulaEvaluationService';
import VariavelRepository from '../repositories/VariavelRepository';
import {
  AtualizarVariavelInput,
  CriarVariavelInput,
  ReordenarVariaveisInput,
} from '../schemas/variavel.schema';

export type VariavelEnriquecida = Variavel & {
  optionsList: string[];
  formulaLegivel: string | null;
};

class VariavelService extends BaseService {
  private studyAuthorization = new StudyAuthorization();
  private variavelRepository = new VariavelRepository();
  private estudoRepository = new EstudoRepository();
  private validacaoStatus = StudyStatusValidation;

  private enriquecerLista(variaveis: Variavel[]): VariavelEnriquecida[] {
    const mapaNomes = new Map<number, string>(variaveis.map((v) => [v.id, v.nome]));
    return variaveis.map((v) => ({
      ...v,
      optionsList: parseVariableOptions(v.options),
      formulaLegivel: FormulaEvaluationService.traduzirFormulaLegivel(v.formula, mapaNomes),
    }));
  }

  private async enriquecerUma(variavel: Variavel): Promise<VariavelEnriquecida> {
    const todas = await this.variavelRepository.findAllByStudy(variavel.estudoId);
    const mapaNomes = new Map<number, string>(todas.map((v) => [v.id, v.nome]));
    return {
      ...variavel,
      optionsList: parseVariableOptions(variavel.options),
      formulaLegivel: FormulaEvaluationService.traduzirFormulaLegivel(variavel.formula, mapaNomes),
    };
  }

  async estudoExiste(estudoId: number) {
    const estudo = await this.estudoRepository.findById(estudoId);
    if (!estudo) {
      throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
    }

    return estudo;
  }

  async listaVariaveis(estudoId: number, userId: number) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canView(userId, estudoId);

    const variaveis = await this.variavelRepository.findAllByStudy(estudoId);
    return this.enriquecerLista(variaveis);
  }

  async listaVariaveisPorId(estudoId: number, variavelId: number, userId: number) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canView(userId, estudoId);

    const variavel = await this.variavelRepository.findById(variavelId);
    if (!variavel || variavel.estudoId !== estudoId) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
    }

    return this.enriquecerUma(variavel);
  }

  async criar(data: CriarVariavelInput, userId: number, estudoId: number) {
    const estudo = await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await this.validacaoStatus.canEditStructure(estudo);

    const variavelExistente = await this.variavelRepository.findByNameInStudy(data.nome, estudoId);
    if (variavelExistente) {
      throw new AppError('CONFLICT', 'Esta variável já existe para este estudo.', HttpStatus.CONFLICT);
    }

    if (data.dataType === DataType.choice) {
      const serialized = serializeVariableOptions(data.options);
      if (!serialized) {
        throw new AppError(
          'INVALID_OPTIONS',
          'Variáveis do tipo escolha exigem ao menos uma opção.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    if (data.dataType === DataType.calculated) {
      if (!data.formula) {
        throw new AppError(
          'INVALID_FORMULA',
          'Variáveis calculadas exigem uma fórmula matemática.',
          HttpStatus.BAD_REQUEST
        );
      }
      await FormulaEvaluationService.validarFormula(estudoId, data.formula);
    }

    const ordemFinal = data.ordem ?? (await this.variavelRepository.getNextOrdem(estudoId));
    const variavel = await this.variavelRepository.criar(data, estudoId, ordemFinal);

    return this.enriquecerUma(variavel);
  }

  async atualizar(
    userId: number,
    estudoId: number,
    variavelId: number,
    data: AtualizarVariavelInput
  ) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    const variavelExiste = await this.variavelRepository.findById(variavelId);
    if (!variavelExiste || variavelExiste.estudoId !== estudoId) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
    }

    if (data.nome) {
      const variavelComMesmoNome = await this.variavelRepository.findByNameInStudy(data.nome, estudoId);
      if (variavelComMesmoNome && variavelComMesmoNome.id !== variavelId) {
        throw new AppError('CONFLICT', 'Esta variável já existe.', HttpStatus.CONFLICT);
      }
    }

    const novoDataType = data.dataType ?? variavelExiste.dataType;
    if (novoDataType === DataType.choice && data.options !== undefined) {
      const serialized = serializeVariableOptions(data.options);
      if (!serialized) {
        throw new AppError(
          'INVALID_OPTIONS',
          'Variáveis do tipo escolha exigem ao menos uma opção.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    if (novoDataType === DataType.calculated) {
      const formulaFinal = data.formula !== undefined ? data.formula : variavelExiste.formula;
      if (!formulaFinal) {
        throw new AppError(
          'INVALID_FORMULA',
          'Variáveis calculadas exigem uma fórmula matemática.',
          HttpStatus.BAD_REQUEST
        );
      }
      await FormulaEvaluationService.validarFormula(estudoId, formulaFinal, variavelId);
    }

    const variavel = await this.variavelRepository.atualizar(data, estudoId, variavelId);
    return this.enriquecerUma(variavel);
  }

  async reordenar(userId: number, estudoId: number, data: ReordenarVariaveisInput) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    const variaveisEstudo = await this.variavelRepository.findAllByStudy(estudoId);
    const idsValidos = new Set(variaveisEstudo.map((v) => v.id));

    for (const item of data.itens) {
      if (!idsValidos.has(item.id)) {
        throw new AppError(
          'VARIAVEL_NOT_FOUND',
          `Variável ID ${item.id} não pertence a este estudo.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const atualizadas = await this.variavelRepository.reordenar(estudoId, data.itens);
    return this.enriquecerLista(atualizadas);
  }

  async deletar(userId: number, variavelId: number, estudoId: number) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    const variavelExiste = await this.variavelRepository.findById(variavelId);
    if (!variavelExiste || variavelExiste.estudoId !== estudoId) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
    }

    await this.variavelRepository.deletar(variavelId);
  }

  async buscarExcluidas(userId: number, estudoId: number) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    return this.variavelRepository.findAllExcluidos(estudoId);
  }

  async restaurar(userId: number, estudoId: number, variavelId: number) {
    await this.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    const variavel = await this.variavelRepository.findByIdIncludingDeleted(estudoId, variavelId);
    if (!variavel) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
    }

    if (variavel.deletedAt === null) {
      throw new AppError('VARIAVEL_ALREADY_ACTIVE', 'Esta variável já está ativa.', HttpStatus.CONFLICT);
    }

    const restaurada = await this.variavelRepository.restaura(variavel.id);
    return this.enriquecerUma(restaurada);
  }
}

export default VariavelService;
