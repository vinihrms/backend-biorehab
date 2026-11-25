import { DataType, Variavel } from '@prisma/client';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import {
  parseMultiChoiceAnswer,
  parseVariableOptions,
  serializeMultiChoiceAnswer,
} from '../../../utils/choice-options';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import VariavelRepository from '../../variaveis/repositories/VariavelRepository';
import VisitaRepository from '../../visitas/repositories/VisitaRepository';
import MedicaoRepository from '../repositories/MedicaoRepository';
import { AtualizarMedicaoInput, CriarMedicaoInput } from '../schemas/medicao.schema';
import FormulaEvaluationService from './FormulaEvaluationService';

class MedicaoService extends BaseService {
  private studyAuthorization = new StudyAuthorization();
  private visitaRepository = new VisitaRepository();
  private variavelRepository = new VariavelRepository();
  private medicaoRepository = new MedicaoRepository();
  private estudoRepository = new EstudoRepository();
  private validacaoStatus = StudyStatusValidation;

  async estudoExiste(estudoId: number) {
    const estudo = await this.estudoRepository.findById(estudoId);
    if (!estudo) {
      throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
    }
    return estudo;
  }

  private async visitaExiste(visitaId: number) {
    const visita = await this.visitaRepository.buscaVisitaPorId(visitaId);
    if (!visita) {
      throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
    }
    return visita;
  }

  private async variavelExiste(variavelId: number) {
    const variavel = await this.variavelRepository.findById(variavelId);
    if (!variavel) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
    }
    return variavel;
  }

  /**
   * Valida e normaliza o payload da medição de acordo com o `dataType` e `allowMultiple` da variável.
   */
  private validarENormalizarValor(
    variavel: Variavel,
    data: CriarMedicaoInput | AtualizarMedicaoInput
  ): { valorNum?: number; valorText?: string } {
    const erro = (mensagem: string): never => {
      throw new AppError('INVALID_MEASUREMENT_VALUE', mensagem, HttpStatus.BAD_REQUEST);
    };

    switch (variavel.dataType) {
      case DataType.calculated:
        throw new AppError(
          'CALCULATED_VARIABLE_READONLY',
          `A variável "${variavel.nome}" é calculada automaticamente por fórmula e não pode ser preenchida manualmente.`,
          HttpStatus.BAD_REQUEST
        );

      case DataType.numeric:
        if (data.valorNum === undefined) erro('Valor numérico não informado.');
        if (data.valorText !== undefined || data.valorOpcoes !== undefined) {
          erro('Valor textual informado para variável numérica.');
        }
        return { valorNum: data.valorNum! };

      case DataType.integer:
        if (data.valorNum === undefined) erro('Valor inteiro não informado.');
        if (!Number.isInteger(data.valorNum)) erro('Valor informado não é um inteiro.');
        if (data.valorText !== undefined || data.valorOpcoes !== undefined) {
          erro('Valor textual informado para variável inteira.');
        }
        return { valorNum: data.valorNum! };

      case DataType.text:
        if (data.valorText === undefined) erro('Valor textual não informado.');
        if (data.valorNum !== undefined) erro('Valor numérico informado para variável textual.');
        return { valorText: data.valorText! };

      case DataType.boolean:
        if (data.valorText === undefined) erro('Valor booleano não informado.');
        if (data.valorNum !== undefined) erro('Valor numérico informado para variável booleana.');
        if (data.valorText !== 'true' && data.valorText !== 'false') {
          erro('Valor booleano inválido. Informe true ou false.');
        }
        return { valorText: data.valorText! };

      case DataType.choice: {
        if (data.valorNum !== undefined) {
          erro('Valor numérico informado para variável de escolha.');
        }

        const opcoesPermitidas = parseVariableOptions(variavel.options);
        if (opcoesPermitidas.length === 0) {
          erro('Esta variável de escolha não possui opções cadastradas.');
        }

        if (variavel.allowMultiple) {
          const selecionadas =
            data.valorOpcoes !== undefined
              ? data.valorOpcoes
              : data.valorText !== undefined
                ? parseMultiChoiceAnswer(data.valorText)
                : [];

          if (selecionadas.length === 0) {
            erro('Informe ao menos uma opção para esta variável de múltipla escolha.');
          }

          for (const item of selecionadas) {
            if (!opcoesPermitidas.includes(item.trim())) {
              erro(`A opção "${item}" não está entre as opções permitidas.`);
            }
          }

          return { valorText: serializeMultiChoiceAnswer(selecionadas) };
        }

        const valorUnico =
          data.valorText ??
          (data.valorOpcoes && data.valorOpcoes.length === 1 ? data.valorOpcoes[0] : undefined);

        if (valorUnico === undefined) {
          return erro('Opção não informada.');
        }

        if (!opcoesPermitidas.includes(valorUnico.trim())) {
          return erro('Valor informado não está entre as opções permitidas.');
        }

        return { valorText: valorUnico.trim() };
      }
    }
  }

  async listar(usuarioId: number, visitaId: number) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);

    const medicoes = await this.medicaoRepository.listarPorVisita(visitaId);
    return medicoes.map((m) => ({
      ...m,
      valorOpcoes:
        m.variavel.dataType === DataType.choice && m.variavel.allowMultiple
          ? parseMultiChoiceAnswer(m.valorText)
          : undefined,
    }));
  }

  async listarExcluidas(usuarioId: number, visitaId: number) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);
    return this.medicaoRepository.listarExcluidas(visitaId);
  }

  async criar(usuarioId: number, visitaId: number, data: CriarMedicaoInput) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canCollectMeasurements(
      usuarioId,
      visita.participacaoEstudo.estudoId
    );

    const variavel = await this.variavelExiste(data.variavelId);
    const estudo = await this.estudoExiste(variavel.estudoId);
    await this.validacaoStatus.canCollectData(estudo);

    if (variavel.deletedAt) {
      throw new AppError('VARIAVEL_DELETED', 'Variável encontra-se excluida.', HttpStatus.NOT_FOUND);
    }

    if (variavel.estudoId !== visita.participacaoEstudo.estudoId) {
      throw new AppError(
        'VARIAVEL_NOT_PERTENCE',
        'Variável não pertence a este estudo.',
        HttpStatus.BAD_REQUEST
      );
    }

    const medicaoExiste = await this.medicaoRepository.existeMesmaVariavel(visitaId, variavel.id);
    if (medicaoExiste) {
      throw new AppError(
        'MEDICAO_ALREADY_EXISTS',
        'Já existe uma medição para esta visita e variável.',
        HttpStatus.CONFLICT
      );
    }

    const medicaoDeletadaExiste = await this.medicaoRepository.existeMesmaVariavelcomDeleted(
      visitaId,
      variavel.id
    );
    if (medicaoDeletadaExiste) {
      throw new AppError(
        'DELETED_MEDICAO_ALREADY_EXISTS',
        'Já existe uma medição deletada para esta visita e variável.',
        HttpStatus.CONFLICT
      );
    }

    const normalizado = this.validarENormalizarValor(variavel, data);
    const medicao = await this.medicaoRepository.criar(visitaId, usuarioId, {
      variavelId: data.variavelId,
      ...normalizado,
    });

    const calculadas = await FormulaEvaluationService.recalcularVisita(visitaId);

    return {
      ...medicao,
      valorOpcoes:
        variavel.dataType === DataType.choice && variavel.allowMultiple
          ? parseMultiChoiceAnswer(medicao.valorText)
          : undefined,
      medicoesCalculadas: calculadas,
    };
  }

  async buscarPorId(usuarioId: number, visitaId: number, medicaoId: number) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);

    const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
    if (!medicao) {
      throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
    }

    return {
      ...medicao,
      valorOpcoes:
        medicao.variavel.dataType === DataType.choice && medicao.variavel.allowMultiple
          ? parseMultiChoiceAnswer(medicao.valorText)
          : undefined,
    };
  }

  async atualizar(
    usuarioId: number,
    visitaId: number,
    medicaoId: number,
    data: AtualizarMedicaoInput
  ) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canCollectMeasurements(
      usuarioId,
      visita.participacaoEstudo.estudoId
    );

    const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
    if (!medicao) {
      throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
    }

    const normalizado = this.validarENormalizarValor(medicao.variavel, data);
    const atualizada = await this.medicaoRepository.atualizar(medicaoId, normalizado);
    const calculadas = await FormulaEvaluationService.recalcularVisita(visitaId);

    return {
      ...atualizada,
      valorOpcoes:
        medicao.variavel.dataType === DataType.choice && medicao.variavel.allowMultiple
          ? parseMultiChoiceAnswer(atualizada.valorText)
          : undefined,
      medicoesCalculadas: calculadas,
    };
  }

  async deletar(usuarioId: number, visitaId: number, medicaoId: number) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canCollectMeasurements(
      usuarioId,
      visita.participacaoEstudo.estudoId
    );

    const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
    if (!medicao) {
      throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
    }
    if (medicao.deletedAt) {
      throw new AppError(
        'MEDICAO_ALREADY_DELETED',
        'Medição já se encontra deletada.',
        HttpStatus.CONFLICT
      );
    }

    const deletada = await this.medicaoRepository.apagar(medicaoId);
    await FormulaEvaluationService.recalcularVisita(visitaId);
    return deletada;
  }

  async restaurar(usuarioId: number, visitaId: number, medicaoId: number) {
    const visita = await this.visitaExiste(visitaId);
    if (visita.deletedAt) {
      throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
    }
    if (visita.participacaoEstudo.deletedAt) {
      throw new AppError(
        'PARTICIPACAO_DELETED',
        'Participação encontra-se excluida.',
        HttpStatus.NOT_FOUND
      );
    }

    await this.studyAuthorization.canCollectMeasurements(
      usuarioId,
      visita.participacaoEstudo.estudoId
    );

    const medicao = await this.medicaoRepository.buscaPorIdComDeletado(visitaId, medicaoId);
    if (!medicao) {
      throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
    }
    if (medicao.deletedAt == null) {
      throw new AppError('MEDICAO_ALREADY_ACTIVE', 'Medição já está ativa.', HttpStatus.CONFLICT);
    }

    const restaurada = await this.medicaoRepository.restaurar(medicaoId);
    await FormulaEvaluationService.recalcularVisita(visitaId);
    return restaurada;
  }
}

export default MedicaoService;
