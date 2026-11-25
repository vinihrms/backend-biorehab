import { DataType, Prisma, Variavel } from '@prisma/client';
import { Parser } from 'expr-eval';
import prisma from '../../../config/prisma';
import { AppError } from '../../../errors/app-error';
import { HttpStatus } from '../../../utils/http-status';

const VAR_TOKEN_REGEX = /\{v:(\d+)\}/g;
const SYS_IDADE_REGEX = /\{sys:idade_anos\}/g;

const parser = new Parser({
  operators: {
    logical: false,
    comparison: false,
    conditional: false,
    assignment: false,
    concatenate: false,
    in: false,
  },
});

export class FormulaEvaluationService {
  static extrairDependencias(formula: string): number[] {
    const ids = new Set<number>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(VAR_TOKEN_REGEX.source, 'g');
    while ((match = regex.exec(formula)) !== null) {
      const id = Number(match[1]);
      if (Number.isInteger(id) && id > 0) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  }

  static normalizarExpressao(formula: string): string {
    return formula
      .replace(VAR_TOKEN_REGEX, (_match, id) => `v_${id}`)
      .replace(SYS_IDADE_REGEX, 'idade_anos');
  }

  static traduzirFormulaLegivel(
    formula: string | null | undefined,
    mapaNomes: Map<number, string>
  ): string | null {
    if (!formula) return null;
    return formula
      .replace(VAR_TOKEN_REGEX, (_match, idStr) => {
        const id = Number(idStr);
        const nome = mapaNomes.get(id);
        return nome ? `[${nome}]` : `{v:${id}}`;
      })
      .replace(SYS_IDADE_REGEX, '[idade_anos]');
  }

  static calcularIdadeAnos(nascimento: Date, dataReferencia: Date): number {
    const diffMs = dataReferencia.getTime() - nascimento.getTime();
    const anos = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    return Number(Math.max(0, anos).toFixed(4));
  }

  static async validarFormula(
    estudoId: number,
    formula: string,
    variavelAtualId?: number
  ): Promise<number[]> {
    const trimmed = formula.trim();
    if (!trimmed) {
      throw new AppError(
        'INVALID_FORMULA',
        'A fórmula é obrigatória para variáveis calculadas.',
        HttpStatus.BAD_REQUEST
      );
    }

    const exprNormalizada = this.normalizarExpressao(trimmed);
    const dependencias = this.extrairDependencias(trimmed);

    let compiled;
    try {
      compiled = parser.parse(exprNormalizada);
    } catch {
      throw new AppError(
        'INVALID_FORMULA',
        'Sintaxe da fórmula inválida. Use operadores matemáticos (+, -, *, /, ^, parênteses), {v:ID} e/ou idade_anos.',
        HttpStatus.BAD_REQUEST
      );
    }

    const varsNaExpressao = compiled.variables();
    const variaveisPermitidas = new Set<string>([
      'idade_anos',
      ...dependencias.map((id) => `v_${id}`),
    ]);

    for (const v of varsNaExpressao) {
      if (!variaveisPermitidas.has(v)) {
        throw new AppError(
          'INVALID_FORMULA_VARIABLE',
          `Símbolo desconhecido na fórmula: "${v}". Utilize {v:ID} para variáveis do estudo ou idade_anos.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Teste seco de avaliação para validar funções e operadores
    const testScope: Record<string, number> = { idade_anos: 30 };
    for (const depId of dependencias) {
      testScope[`v_${depId}`] = 2;
    }
    try {
      const testVal = compiled.evaluate(testScope);
      if (typeof testVal !== 'number') {
        throw new Error('Resultado não numérico');
      }
    } catch {
      throw new AppError(
        'INVALID_FORMULA',
        'Não foi possível avaliar a fórmula informada.',
        HttpStatus.BAD_REQUEST
      );
    }

    const variaveisEstudo = await prisma.variavel.findMany({
      where: { estudoId, deletedAt: null },
    });

    const mapaVariaveis = new Map<number, Variavel>(
      variaveisEstudo.map((v) => [v.id, v])
    );

    const tiposPermitidos: DataType[] = [
      DataType.numeric,
      DataType.integer,
      DataType.calculated,
    ];

    for (const depId of dependencias) {
      if (variavelAtualId !== undefined && depId === variavelAtualId) {
        throw new AppError(
          'FORMULA_CYCLE',
          'Uma variável calculada não pode referenciar a si mesma.',
          HttpStatus.BAD_REQUEST
        );
      }

      const dep = mapaVariaveis.get(depId);
      if (!dep) {
        throw new AppError(
          'INVALID_FORMULA_DEPENDENCY',
          `Variável referenciada (ID ${depId}) não encontrada neste estudo.`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (!tiposPermitidos.includes(dep.dataType)) {
        throw new AppError(
          'INVALID_FORMULA_DEPENDENCY',
          `A variável "${dep.nome}" (${dep.dataType}) não pode ser usada em fórmulas matemáticas.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Verificação de ciclos (DFS) caso seja atualização de uma variável existente
    if (variavelAtualId !== undefined) {
      const grafo = new Map<number, number[]>();
      for (const v of variaveisEstudo) {
        if (v.id === variavelAtualId) {
          grafo.set(v.id, dependencias);
        } else if (v.dataType === DataType.calculated && v.formula) {
          grafo.set(v.id, this.extrairDependencias(v.formula));
        }
      }

      const visitando = new Set<number>();
      const visitado = new Set<number>();

      const temCiclo = (no: number): boolean => {
        if (visitando.has(no)) return true;
        if (visitado.has(no)) return false;
        visitando.add(no);
        for (const vizinho of grafo.get(no) ?? []) {
          if (temCiclo(vizinho)) return true;
        }
        visitando.delete(no);
        visitado.add(no);
        return false;
      };

      if (temCiclo(variavelAtualId)) {
        throw new AppError(
          'FORMULA_CYCLE',
          'Referência circular detectada nas fórmulas das variáveis calculadas.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    return dependencias;
  }

  private static ordenarTopologicamente(variaveisCalc: Variavel[]): Variavel[] {
    const mapa = new Map<number, Variavel>(variaveisCalc.map((v) => [v.id, v]));
    const inDegree = new Map<number, number>();
    const dependentes = new Map<number, number[]>();

    for (const v of variaveisCalc) {
      inDegree.set(v.id, 0);
      dependentes.set(v.id, []);
    }

    for (const v of variaveisCalc) {
      if (!v.formula) continue;
      const deps = this.extrairDependencias(v.formula);
      for (const depId of deps) {
        if (mapa.has(depId)) {
          inDegree.set(v.id, (inDegree.get(v.id) ?? 0) + 1);
          dependentes.get(depId)!.push(v.id);
        }
      }
    }

    const fila: number[] = [];
    for (const [id, grau] of inDegree.entries()) {
      if (grau === 0) fila.push(id);
    }

    const ordenadas: Variavel[] = [];
    while (fila.length > 0) {
      const atualId = fila.shift()!;
      const atual = mapa.get(atualId);
      if (atual) ordenadas.push(atual);

      for (const depDe of dependentes.get(atualId) ?? []) {
        const novoGrau = (inDegree.get(depDe) ?? 1) - 1;
        inDegree.set(depDe, novoGrau);
        if (novoGrau === 0) fila.push(depDe);
      }
    }

    return ordenadas;
  }

  static async recalcularVisita(
    visitaId: number,
    client: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    const visita = await client.visita.findUnique({
      where: { id: visitaId },
      include: {
        participacaoEstudo: {
          include: {
            participante: true,
          },
        },
      },
    });

    if (!visita || visita.deletedAt !== null) {
      return [];
    }

    const estudoId = visita.participacaoEstudo.estudoId;
    const variaveisCalculadas = await client.variavel.findMany({
      where: {
        estudoId,
        dataType: DataType.calculated,
        deletedAt: null,
      },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    if (variaveisCalculadas.length === 0) {
      return [];
    }

    const medicoesVisita = await client.medicao.findMany({
      where: { visitaId },
    });

    const valoresAtivos = new Map<number, number>();
    const medicaoPorVariavel = new Map<number, (typeof medicoesVisita)[number]>();

    for (const m of medicoesVisita) {
      medicaoPorVariavel.set(m.variavelId, m);
      if (m.deletedAt === null && m.valorNum !== null) {
        valoresAtivos.set(m.variavelId, Number(m.valorNum));
      }
    }

    const idadeAnos = this.calcularIdadeAnos(
      visita.participacaoEstudo.participante.nascimento,
      visita.data
    );

    const ordenadas = this.ordenarTopologicamente(variaveisCalculadas);
    const atualizadas = [];

    for (const variavel of ordenadas) {
      if (!variavel.formula) continue;

      const deps = this.extrairDependencias(variavel.formula);
      const todasPresentes = deps.every((depId) => valoresAtivos.has(depId));
      const existente = medicaoPorVariavel.get(variavel.id);

      if (!todasPresentes) {
        valoresAtivos.delete(variavel.id);
        if (existente && existente.deletedAt === null) {
          await client.medicao.update({
            where: { id: existente.id },
            data: { deletedAt: new Date() },
          });
        }
        continue;
      }

      const scope: Record<string, number> = { idade_anos: idadeAnos };
      for (const depId of deps) {
        scope[`v_${depId}`] = valoresAtivos.get(depId)!;
      }

      let resultado: number | null = null;
      try {
        const expr = parser.parse(this.normalizarExpressao(variavel.formula));
        const raw = expr.evaluate(scope);
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          const casas = Math.min(4, Math.max(0, variavel.casasDecimais ?? 2));
          resultado = Number(raw.toFixed(casas));
        }
      } catch {
        resultado = null;
      }

      if (resultado === null) {
        valoresAtivos.delete(variavel.id);
        if (existente && existente.deletedAt === null) {
          await client.medicao.update({
            where: { id: existente.id },
            data: { deletedAt: new Date() },
          });
        }
        continue;
      }

      valoresAtivos.set(variavel.id, resultado);

      if (existente) {
        const updated = await client.medicao.update({
          where: { id: existente.id },
          data: {
            valorNum: resultado,
            valorText: null,
            deletedAt: null,
          },
          include: { variavel: true },
        });
        atualizadas.push(updated);
      } else {
        const created = await client.medicao.create({
          data: {
            visitaId,
            variavelId: variavel.id,
            valorNum: resultado,
            valorText: null,
            createdBy: 'SISTEMA_CALCULO',
          },
          include: { variavel: true },
        });
        medicaoPorVariavel.set(variavel.id, created);
        atualizadas.push(created);
      }
    }

    return atualizadas;
  }
}

export default FormulaEvaluationService;
