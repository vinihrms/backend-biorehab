import { DataType } from '@prisma/client';
import { parseMultiChoiceAnswer, parseVariableOptions } from '../../../utils/choice-options';
import FormulaEvaluationService from '../../medicoes/services/FormulaEvaluationService';
import { ExportarEstudoInput, LinhaExportacao } from '../schemas/export.schema';

export type BlindingExportContext = {
  canViewAll: boolean;
  canViewOnlyUnblinded: boolean;
};

export type ExportDataset = {
  colunas: string[];
  linhas: LinhaExportacao[];
  dicionario: Array<{
    ordem: number;
    nome: string;
    unidade: string;
    dataType: string;
    allowMultiple: string;
    options: string;
    formula: string;
  }>;
  gruposVisiveis: Array<{
    nome: string;
    descricaoMetodo: string;
  }>;
};

class ExportBuilder {
  private sanitizarSufixo(texto: string): string {
    return texto.trim().replace(/\s+/g, '_');
  }

  private resolverGrupoVisivel(
    alocacao: any,
    blinding: BlindingExportContext
  ): string | null {
    if (!alocacao?.grupoEstudo) return null;
    if (blinding.canViewAll) {
      return alocacao.grupoEstudo.nome;
    }
    if (blinding.canViewOnlyUnblinded && Boolean(alocacao.quebradoEm)) {
      return alocacao.grupoEstudo.nome;
    }
    return null;
  }

  private extrairValorMedicao(
    medicao: any,
    variavel: any
  ): string | number | null {
    if (!medicao) return null;

    if (
      variavel.dataType === DataType.numeric ||
      variavel.dataType === DataType.integer ||
      variavel.dataType === DataType.calculated
    ) {
      return medicao.valorNum !== null && medicao.valorNum !== undefined
        ? Number(medicao.valorNum)
        : null;
    }

    if (variavel.dataType === DataType.choice && variavel.allowMultiple) {
      const selecionadas = parseMultiChoiceAnswer(medicao.valorText);
      return selecionadas.length > 0 ? selecionadas.join('; ') : null;
    }

    return medicao.valorText ?? (medicao.valorNum !== null ? Number(medicao.valorNum) : null);
  }

  private colunasParaVariavel(
    variavel: any,
    formatoMultiEscolha: 'concatenado' | 'binario',
    sufixoVisita?: string
  ): Array<{ coluna: string; opcaoAlvo?: string }> {
    const sufixo = sufixoVisita ? `_${this.sanitizarSufixo(sufixoVisita)}` : '';

    if (
      variavel.dataType === DataType.choice &&
      variavel.allowMultiple &&
      formatoMultiEscolha === 'binario'
    ) {
      const opcoes = parseVariableOptions(variavel.options);
      if (opcoes.length > 0) {
        return opcoes.map((opt) => ({
          coluna: `${variavel.nome}__${this.sanitizarSufixo(opt)}${sufixo}`,
          opcaoAlvo: opt,
        }));
      }
    }

    return [{ coluna: `${variavel.nome}${sufixo}` }];
  }

  private preencherMedicaoNaLinha(
    linha: LinhaExportacao,
    variavel: any,
    medicao: any,
    formatoMultiEscolha: 'concatenado' | 'binario',
    sufixoVisita?: string
  ) {
    const specs = this.colunasParaVariavel(variavel, formatoMultiEscolha, sufixoVisita);

    if (
      variavel.dataType === DataType.choice &&
      variavel.allowMultiple &&
      formatoMultiEscolha === 'binario'
    ) {
      const selecionadas = new Set(parseMultiChoiceAnswer(medicao?.valorText));
      for (const spec of specs) {
        if (!medicao) {
          linha[spec.coluna] = null;
        } else {
          linha[spec.coluna] = spec.opcaoAlvo && selecionadas.has(spec.opcaoAlvo) ? 1 : 0;
        }
      }
      return;
    }

    const spec = specs[0];
    if (spec) {
      linha[spec.coluna] = this.extrairValorMedicao(medicao, variavel);
    }
  }

  montar(
    estudo: any,
    opcoes: ExportarEstudoInput,
    blinding: BlindingExportContext
  ): ExportDataset {
    const variaveisSelecionadas =
      opcoes.incluirVariaveis.length > 0
        ? estudo.variaveis.filter((v: any) => opcoes.incluirVariaveis.includes(v.id))
        : estudo.variaveis;

    const tiposVisitaSelecionados =
      opcoes.incluirVisitas.length > 0
        ? estudo.tipoVisitas.filter((tv: any) => opcoes.incluirVisitas.includes(tv.id))
        : estudo.tipoVisitas;

    const temQualquerGrupoVisivel =
      opcoes.incluirGrupo &&
      (blinding.canViewAll
        ? estudo.grupos.length > 0 ||
          estudo.participacoes.some((p: any) => p.alocacao !== null)
        : blinding.canViewOnlyUnblinded &&
          estudo.participacoes.some((p: any) => Boolean(p.alocacao?.quebradoEm)));

    const colunas: string[] = [];

    if (opcoes.incluirParticipantes) {
      colunas.push('codigo', 'sexo', 'nascimento');
    }

    if (temQualquerGrupoVisivel) {
      colunas.push('grupo');
    }

    const linhas: LinhaExportacao[] = [];

    if (opcoes.layout === 'wide') {
      for (const tv of tiposVisitaSelecionados) {
        colunas.push(`data_${this.sanitizarSufixo(tv.nome)}`);
        for (const v of variaveisSelecionadas) {
          for (const spec of this.colunasParaVariavel(v, opcoes.formatoMultiEscolha, tv.nome)) {
            colunas.push(spec.coluna);
          }
        }
      }

      for (const participacao of estudo.participacoes) {
        const visitasPorTipo = new Map<number, any>();
        for (const visita of participacao.visitas) {
          visitasPorTipo.set(visita.tipoVisitaId, visita);
        }

        const linha: LinhaExportacao = {};

        if (opcoes.incluirParticipantes) {
          linha.codigo = participacao.codigo;
          linha.sexo = participacao.participante.sexo;
          linha.nascimento = participacao.participante.nascimento;
        }

        if (temQualquerGrupoVisivel) {
          linha.grupo = this.resolverGrupoVisivel(participacao.alocacao, blinding);
        }

        let possuiAlgumaVisita = false;

        for (const tv of tiposVisitaSelecionados) {
          const visita = visitasPorTipo.get(tv.id);
          const colData = `data_${this.sanitizarSufixo(tv.nome)}`;
          linha[colData] = visita ? visita.data : null;

          if (visita) possuiAlgumaVisita = true;

          const medicoesPorVar = new Map<number, any>();
          if (visita) {
            for (const m of visita.medicoes) {
              medicoesPorVar.set(m.variavelId, m);
            }
          }

          for (const v of variaveisSelecionadas) {
            this.preencherMedicaoNaLinha(
              linha,
              v,
              medicoesPorVar.get(v.id),
              opcoes.formatoMultiEscolha,
              tv.nome
            );
          }
        }

        if (opcoes.incluirVisitas.length > 0 && !possuiAlgumaVisita) {
          continue;
        }

        linhas.push(linha);
      }
    } else {
      // Layout LONG (1 linha por visita)
      colunas.push('visita', 'data');
      for (const v of variaveisSelecionadas) {
        for (const spec of this.colunasParaVariavel(v, opcoes.formatoMultiEscolha)) {
          colunas.push(spec.coluna);
        }
      }

      const ordemTipoVisita = new Map<number, number>(
        estudo.tipoVisitas.map((tv: any, idx: number) => [tv.id, idx])
      );

      for (const participacao of estudo.participacoes) {
        const visitasOrdenadas = [...participacao.visitas].sort((a: any, b: any) => {
          const oa = ordemTipoVisita.get(a.tipoVisitaId) ?? 9999;
          const ob = ordemTipoVisita.get(b.tipoVisitaId) ?? 9999;
          if (oa !== ob) return oa - ob;
          return new Date(a.data).getTime() - new Date(b.data).getTime();
        });

        for (const visita of visitasOrdenadas) {
          if (
            opcoes.incluirVisitas.length > 0 &&
            !opcoes.incluirVisitas.includes(visita.tipoVisitaId)
          ) {
            continue;
          }

          const medicoesPorVar = new Map<number, any>();
          for (const m of visita.medicoes) {
            medicoesPorVar.set(m.variavelId, m);
          }

          if (opcoes.incluirVariaveis.length > 0) {
            const possuiVariavel = variaveisSelecionadas.some((v: any) =>
              medicoesPorVar.has(v.id)
            );
            if (!possuiVariavel) continue;
          }

          const linha: LinhaExportacao = {};

          if (opcoes.incluirParticipantes) {
            linha.codigo = participacao.codigo;
            linha.sexo = participacao.participante.sexo;
            linha.nascimento = participacao.participante.nascimento;
          }

          if (temQualquerGrupoVisivel) {
            linha.grupo = this.resolverGrupoVisivel(participacao.alocacao, blinding);
          }

          linha.visita = visita.tipoVisita.nome;
          linha.data = visita.data;

          for (const v of variaveisSelecionadas) {
            this.preencherMedicaoNaLinha(
              linha,
              v,
              medicoesPorVar.get(v.id),
              opcoes.formatoMultiEscolha
            );
          }

          linhas.push(linha);
        }
      }
    }

    const mapaNomes = new Map<number, string>(
      estudo.variaveis.map((v: any) => [v.id, v.nome])
    );

    const dicionario = variaveisSelecionadas.map((v: any) => ({
      ordem: v.ordem,
      nome: v.nome,
      unidade: v.unidade ?? '',
      dataType: v.dataType,
      allowMultiple: v.allowMultiple ? 'Sim' : 'Não',
      options: parseVariableOptions(v.options).join('; '),
      formula: FormulaEvaluationService.traduzirFormulaLegivel(v.formula, mapaNomes) ?? '',
    }));

    const gruposVisiveis = blinding.canViewAll
      ? estudo.grupos.map((g: any) => ({
          nome: g.nome,
          descricaoMetodo: g.descricaoMetodo ?? '',
        }))
      : [];

    return {
      colunas,
      linhas,
      dicionario,
      gruposVisiveis,
    };
  }
}

export default ExportBuilder;
