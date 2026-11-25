import { DataType, Prisma, Sexo, StatusEstudo } from '@prisma/client';
import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import * as crypto from 'node:crypto';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import prisma from '../../../config/prisma';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import type { UploadedFile } from '../../../types/express';
import {
  parseVariableOptions,
  serializeMultiChoiceAnswer,
  serializeVariableOptions,
} from '../../../utils/choice-options';
import { HttpStatus } from '../../../utils/http-status';
import FormulaEvaluationService from '../../medicoes/services/FormulaEvaluationService';
import { ExecutarImportacaoInput, MapeamentoColunaInput } from '../schemas/importacao.schema';

type AbaParseada = {
  nome: string;
  colunas: string[];
  linhas: Record<string, unknown>[];
};

type SessaoImportacao = {
  id: string;
  estudoId: number;
  usuarioId: number;
  nomeArquivo: string;
  abas: AbaParseada[];
  expiraEm: number;
};

type ErroLinha = {
  linha: number;
  coluna: string;
  valor: unknown;
  mensagem: string;
};

type MedicaoPreparada = {
  variavelChave: string;
  valorNum: number | null;
  valorText: string | null;
};

type LinhaNormalizada = {
  numeroLinha: number;
  participante: {
    codigo?: string;
    nome?: string;
    sexo?: Sexo;
    nascimento?: Date;
    telefone?: string | null;
  };
  visitas: Array<{
    tipoVisitaChave: string;
    data: Date;
    medicoes: MedicaoPreparada[];
  }>;
};

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessoesEmMemoria = new Map<string, SessaoImportacao>();

function limparSessoesExpiradas() {
  const agora = Date.now();
  for (const [id, sessao] of sessoesEmMemoria.entries()) {
    if (sessao.expiraEm <= agora) {
      sessoesEmMemoria.delete(id);
    }
  }
}

function normalizarTextoChave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function valorVazio(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  const s = String(val).trim();
  if (!s) return true;
  const lower = s.toLowerCase();
  return lower === 'na' || lower === 'n/a' || lower === '-' || lower === 'null' || lower === 'nan';
}

function normalizarNumero(val: unknown): number | null {
  if (valorVazio(val)) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  let str = String(val).trim();
  // Remove separador de milhar quando formato pt-BR (ex: 1.234,56 -> 1234.56)
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

function normalizarData(val: unknown): Date | null {
  if (valorVazio(val)) return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === 'number' && val > 1000) {
    // Serial date do Excel (base 1899-12-30)
    const epoch = Date.UTC(1899, 11, 30);
    const d = new Date(epoch + Math.round(val) * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  // DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(str);
  if (brMatch) {
    const dia = Number(brMatch[1]);
    const mes = Number(brMatch[2]);
    let ano = Number(brMatch[3]);
    if (ano < 100) ano += ano >= 30 ? 1900 : 2000;
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    if (d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia) {
      return d;
    }
  }
  // YYYY-MM-DD
  const isoMatch = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(str);
  if (isoMatch) {
    const ano = Number(isoMatch[1]);
    const mes = Number(isoMatch[2]);
    const dia = Number(isoMatch[3]);
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizarSexo(val: unknown): Sexo | null {
  if (valorVazio(val)) return null;
  const norm = normalizarTextoChave(String(val));
  if (['m', 'masc', 'masculino', 'homem', 'male'].includes(norm)) return Sexo.MASCULINO;
  if (['f', 'fem', 'feminino', 'mulher', 'female'].includes(norm)) return Sexo.FEMININO;
  if (['o', 'outro', 'outros', 'other', 'nao binario'].includes(norm)) return Sexo.OUTRO;
  return null;
}

function normalizarBooleano(val: unknown): 'true' | 'false' | null {
  if (valorVazio(val)) return null;
  const norm = normalizarTextoChave(String(val));
  if (['true', '1', 's', 'sim', 'yes', 'y', 'v', 'verdadeiro'].includes(norm)) return 'true';
  if (['false', '0', 'n', 'nao', 'no', 'f', 'falso'].includes(norm)) return 'false';
  return null;
}

function normalizarTelefone(val: unknown): string | null {
  if (valorVazio(val)) return null;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

function extrairValorCelulaExcel(cellValue: ExcelJS.CellValue): unknown {
  if (cellValue === null || cellValue === undefined) return null;
  if (cellValue instanceof Date) return cellValue;
  if (typeof cellValue === 'object') {
    if ('result' in cellValue && cellValue.result !== undefined) {
      return cellValue.result;
    }
    if ('text' in cellValue && typeof cellValue.text === 'string') {
      return cellValue.text;
    }
    if ('richText' in cellValue && Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((r) => r.text).join('');
    }
  }
  return cellValue;
}

class ImportacaoService extends BaseService {
  private studyAuthorization = new StudyAuthorization();

  private async parseArquivo(file: UploadedFile): Promise<AbaParseada[]> {
    const ext = file.originalname.toLowerCase().split('.').pop() ?? '';

    if (ext === 'csv' || file.mimetype.includes('csv') || file.mimetype === 'text/plain') {
      let texto = file.buffer.toString('utf8');
      if (texto.includes('\uFFFD')) {
        texto = file.buffer.toString('latin1');
      }
      texto = texto.replace(/^\uFEFF/, '');

      const primeiraLinha = texto.split(/\r?\n/)[0] ?? '';
      const countPontoVirgula = (primeiraLinha.match(/;/g) ?? []).length;
      const countVirgula = (primeiraLinha.match(/,/g) ?? []).length;
      const delimiter = countPontoVirgula >= countVirgula ? ';' : ',';

      const records = parseCsv(texto, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter,
        relax_column_count: true,
      }) as Record<string, unknown>[];

      const colunas = records.length > 0 ? Object.keys(records[0]!) : [];
      return [{ nome: 'CSV', colunas, linhas: records }];
    }

    if (ext === 'xlsx' || ext === 'xls' || file.mimetype.includes('spreadsheet')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as unknown as Parameters<ExcelJS.Xlsx['load']>[0]);

      const abas: AbaParseada[] = [];

      workbook.eachSheet((sheet) => {
        const headerRow = sheet.getRow(1);
        const colMap = new Map<number, string>();
        const colunas: string[] = [];

        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const nomeCol = String(extrairValorCelulaExcel(cell.value) ?? '').trim();
          if (nomeCol) {
            colMap.set(colNumber, nomeCol);
            colunas.push(nomeCol);
          }
        });

        if (colunas.length === 0) return;

        const linhas: Record<string, unknown>[] = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const obj: Record<string, unknown> = {};
          let temAlgumValor = false;

          for (const [colNum, colNome] of colMap.entries()) {
            const val = extrairValorCelulaExcel(row.getCell(colNum).value);
            if (!valorVazio(val)) temAlgumValor = true;
            obj[colNome] = val;
          }

          if (temAlgumValor) linhas.push(obj);
        }

        abas.push({ nome: sheet.name, colunas, linhas });
      });

      if (abas.length === 0) {
        throw new AppError(
          'EMPTY_SPREADSHEET',
          'A planilha enviada não contém cabeçalhos ou dados válidos.',
          HttpStatus.BAD_REQUEST
        );
      }

      return abas;
    }

    throw new AppError(
      'UNSUPPORTED_FILE_TYPE',
      'Formato não suportado. Envie um arquivo .xlsx ou .csv.',
      HttpStatus.BAD_REQUEST
    );
  }

  async analisarArquivo(userId: number, estudoId: number, file: UploadedFile) {
    limparSessoesExpiradas();
    await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);

    const abas = await this.parseArquivo(file);
    const variaveis = await prisma.variavel.findMany({
      where: { estudoId, deletedAt: null },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    const mapaVariaveis = new Map(variaveis.map((v) => [normalizarTextoChave(v.nome), v]));
    const abaPrincipal = abas[0]!;

    const sugestoesMapeamento = abaPrincipal.colunas.map((coluna) => {
      const norm = normalizarTextoChave(coluna);
      if (['codigo', 'id', 'id_voluntario', 'participante_codigo'].includes(norm)) {
        return { coluna, destino: 'participante_codigo' };
      }
      if (['nome', 'voluntario', 'participante', 'paciente'].includes(norm)) {
        return { coluna, destino: 'participante_nome' };
      }
      if (['sexo', 'genero'].includes(norm)) {
        return { coluna, destino: 'participante_sexo' };
      }
      if (['nascimento', 'data_nascimento', 'dt_nascimento', 'dn'].includes(norm)) {
        return { coluna, destino: 'participante_nascimento' };
      }
      if (['telefone', 'celular', 'whatsapp', 'contato'].includes(norm)) {
        return { coluna, destino: 'participante_telefone' };
      }
      if (['visita', 'tipo_visita', 'momento', 'avaliacao'].includes(norm)) {
        return { coluna, destino: 'visita_tipo' };
      }
      if (['data', 'data_visita', 'data_coleta', 'dt_visita'].includes(norm)) {
        return { coluna, destino: 'visita_data' };
      }
      const varEncontrada = mapaVariaveis.get(norm);
      if (varEncontrada && varEncontrada.dataType !== DataType.calculated) {
        return { coluna, destino: 'variavel', variavelId: varEncontrada.id };
      }
      return { coluna, destino: 'ignorar' };
    });

    const sessionId = crypto.randomBytes(16).toString('hex');
    sessoesEmMemoria.set(sessionId, {
      id: sessionId,
      estudoId,
      usuarioId: userId,
      nomeArquivo: file.originalname,
      abas,
      expiraEm: Date.now() + SESSION_TTL_MS,
    });

    return {
      sessionId,
      nomeArquivo: file.originalname,
      abas: abas.map((a) => ({
        nome: a.nome,
        totalLinhas: a.linhas.length,
        colunas: a.colunas,
      })),
      abaSelecionada: abaPrincipal.nome,
      colunas: abaPrincipal.colunas,
      totalLinhas: abaPrincipal.linhas.length,
      amostra: abaPrincipal.linhas.slice(0, 5),
      sugestoesMapeamento,
    };
  }

  private async prepararSimulacao(
    userId: number,
    estudoId: number,
    data: ExecutarImportacaoInput
  ) {
    limparSessoesExpiradas();
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    const access = await this.studyAuthorization.canManageStudy(userId, estudoId);

    const sessao = sessoesEmMemoria.get(data.sessionId);
    if (!sessao || sessao.estudoId !== estudoId || sessao.usuarioId !== userId) {
      throw new AppError(
        'IMPORT_SESSION_EXPIRED',
        'Sessão de importação expirada ou inválida. Envie a planilha novamente.',
        HttpStatus.NOT_FOUND
      );
    }

    const aba = data.aba
      ? sessao.abas.find((a) => a.nome === data.aba)
      : sessao.abas[0];
    if (!aba) {
      throw new AppError('SHEET_NOT_FOUND', 'Aba da planilha não encontrada.', HttpStatus.BAD_REQUEST);
    }

    const [variaveisExistentes, tiposVisitaExistentes, participacoesExistentes] = await Promise.all([
      prisma.variavel.findMany({ where: { estudoId, deletedAt: null } }),
      prisma.tipoVisita.findMany({ where: { estudoId, deletedAt: null } }),
      prisma.participacaoEstudo.findMany({
        where: { estudoId, deletedAt: null },
        include: { participante: true },
      }),
    ]);

    const querCriarEstrutura =
      data.novasVariaveis.length > 0 || data.novosTiposVisita.length > 0;
    if (querCriarEstrutura && !data.permitirCriarEstrutura) {
      throw new AppError(
        'STRUCTURE_CREATION_NOT_ALLOWED',
        'Ative permitirCriarEstrutura para criar novas variáveis ou tipos de visita durante o mapeamento.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Dicionário combinado (existentes + novas inline)
    type VarDef = {
      chave: string;
      id?: number;
      nome: string;
      dataType: DataType;
      allowMultiple: boolean;
      optionsList: string[];
    };

    const varPorId = new Map<number, VarDef>();
    const varPorNome = new Map<string, VarDef>();

    for (const v of variaveisExistentes) {
      const def: VarDef = {
        chave: `id:${v.id}`,
        id: v.id,
        nome: v.nome,
        dataType: v.dataType,
        allowMultiple: v.allowMultiple,
        optionsList: parseVariableOptions(v.options),
      };
      varPorId.set(v.id, def);
      varPorNome.set(normalizarTextoChave(v.nome), def);
    }

    for (const nv of data.novasVariaveis) {
      const key = normalizarTextoChave(nv.nome);
      if (!varPorNome.has(key)) {
        varPorNome.set(key, {
          chave: `new:${nv.nome}`,
          nome: nv.nome,
          dataType: nv.dataType,
          allowMultiple: nv.dataType === DataType.choice ? nv.allowMultiple : false,
          optionsList: parseVariableOptions(serializeVariableOptions(nv.options)),
        });
      }
    }

    const tvPorId = new Map<number, { chave: string; id?: number; nome: string }>();
    const tvPorNome = new Map<string, { chave: string; id?: number; nome: string }>();

    for (const tv of tiposVisitaExistentes) {
      const def = { chave: `id:${tv.id}`, id: tv.id, nome: tv.nome };
      tvPorId.set(tv.id, def);
      tvPorNome.set(normalizarTextoChave(tv.nome), def);
    }
    for (const ntv of data.novosTiposVisita) {
      const key = normalizarTextoChave(ntv.nome);
      if (!tvPorNome.has(key)) {
        tvPorNome.set(key, { chave: `new:${ntv.nome}`, nome: ntv.nome });
      }
    }

    const resolverVar = (map: MapeamentoColunaInput): VarDef | null => {
      if (map.variavelId !== undefined) return varPorId.get(map.variavelId) ?? null;
      if (map.novaVariavelNome) return varPorNome.get(normalizarTextoChave(map.novaVariavelNome)) ?? null;
      return null;
    };

    const resolverTv = (tipoVisitaId?: number, nome?: string) => {
      if (tipoVisitaId !== undefined) return tvPorId.get(tipoVisitaId) ?? null;
      if (nome) return tvPorNome.get(normalizarTextoChave(nome)) ?? null;
      return null;
    };

    const erros: ErroLinha[] = [];
    const linhasNormalizadas: LinhaNormalizada[] = [];

    const mapPorDestino = (dest: MapeamentoColunaInput['destino']) =>
      data.mapeamento.find((m) => m.destino === dest);

    const colCodigo = mapPorDestino('participante_codigo')?.coluna;
    const colNome = mapPorDestino('participante_nome')?.coluna;
    const colSexo = mapPorDestino('participante_sexo')?.coluna;
    const colNascimento = mapPorDestino('participante_nascimento')?.coluna;
    const colTelefone = mapPorDestino('participante_telefone')?.coluna;
    const colVisitaTipo = mapPorDestino('visita_tipo')?.coluna;
    const colVisitaData = mapPorDestino('visita_data')?.coluna;
    const colsVariaveis = data.mapeamento.filter((m) => m.destino === 'variavel');

    if (!colCodigo && !colNome) {
      throw new AppError(
        'PARTICIPANT_IDENTIFIER_REQUIRED',
        'Mapeie ao menos uma coluna de identificação do participante (participante_codigo ou participante_nome).',
        HttpStatus.BAD_REQUEST
      );
    }

    const partPorCodigo = new Map(
      participacoesExistentes.map((p) => [p.codigo.toLowerCase(), p])
    );
    const partPorNome = new Map(
      participacoesExistentes.map((p) => [normalizarTextoChave(p.participante.nome), p])
    );

    const codigosNovos = new Set<string>();
    const codigosExistentes = new Set<string>();

    const converterValorMedicao = (
      varDef: VarDef,
      rawVal: unknown,
      numeroLinha: number,
      coluna: string
    ): MedicaoPreparada | null | 'ERRO' => {
      if (valorVazio(rawVal)) return null;

      if (varDef.dataType === DataType.calculated) {
        return null;
      }

      if (varDef.dataType === DataType.numeric) {
        const num = normalizarNumero(rawVal);
        if (num === null) {
          erros.push({ linha: numeroLinha, coluna, valor: rawVal, mensagem: 'Valor numérico inválido.' });
          return 'ERRO';
        }
        return { variavelChave: varDef.chave, valorNum: num, valorText: null };
      }

      if (varDef.dataType === DataType.integer) {
        const num = normalizarNumero(rawVal);
        if (num === null || !Number.isInteger(num)) {
          erros.push({ linha: numeroLinha, coluna, valor: rawVal, mensagem: 'Valor inteiro inválido.' });
          return 'ERRO';
        }
        return { variavelChave: varDef.chave, valorNum: num, valorText: null };
      }

      if (varDef.dataType === DataType.boolean) {
        const b = normalizarBooleano(rawVal);
        if (b === null) {
          erros.push({ linha: numeroLinha, coluna, valor: rawVal, mensagem: 'Valor booleano inválido (use Sim/Não ou true/false).' });
          return 'ERRO';
        }
        return { variavelChave: varDef.chave, valorNum: null, valorText: b };
      }

      if (varDef.dataType === DataType.text) {
        return { variavelChave: varDef.chave, valorNum: null, valorText: String(rawVal).trim() };
      }

      if (varDef.dataType === DataType.choice) {
        const opcoesNorm = new Map(varDef.optionsList.map((o) => [normalizarTextoChave(o), o]));
        if (varDef.allowMultiple) {
          const partes = String(rawVal)
            .split(/[;|,]/)
            .map((p) => p.trim())
            .filter(Boolean);
          const resolvidas: string[] = [];
          for (const p of partes) {
            const match = opcoesNorm.get(normalizarTextoChave(p));
            if (!match) {
              erros.push({
                linha: numeroLinha,
                coluna,
                valor: rawVal,
                mensagem: `Opção "${p}" não está nas opções permitidas de "${varDef.nome}".`,
              });
              return 'ERRO';
            }
            resolvidas.push(match);
          }
          return {
            variavelChave: varDef.chave,
            valorNum: null,
            valorText: serializeMultiChoiceAnswer(resolvidas),
          };
        }

        const match = opcoesNorm.get(normalizarTextoChave(String(rawVal)));
        if (!match) {
          erros.push({
            linha: numeroLinha,
            coluna,
            valor: rawVal,
            mensagem: `Opção "${rawVal}" não está nas opções permitidas de "${varDef.nome}".`,
          });
          return 'ERRO';
        }
        return { variavelChave: varDef.chave, valorNum: null, valorText: match };
      }

      return null;
    };

    for (let i = 0; i < aba.linhas.length; i++) {
      const row = aba.linhas[i]!;
      const numeroLinha = i + 2; // Linha 1 é cabeçalho
      let linhaTemErro = false;

      const codigoRaw = colCodigo ? row[colCodigo] : undefined;
      const nomeRaw = colNome ? row[colNome] : undefined;
      const codigo = !valorVazio(codigoRaw) ? String(codigoRaw).trim() : undefined;
      const nome = !valorVazio(nomeRaw) ? String(nomeRaw).trim() : undefined;

      if (!codigo && !nome) {
        erros.push({
          linha: numeroLinha,
          coluna: colCodigo ?? colNome ?? 'participante',
          valor: null,
          mensagem: 'Participante sem código nem nome nesta linha.',
        });
        continue;
      }

      const existente =
        (codigo ? partPorCodigo.get(codigo.toLowerCase()) : undefined) ??
        (nome ? partPorNome.get(normalizarTextoChave(nome)) : undefined);

      let sexo: Sexo | undefined;
      let nascimento: Date | undefined;
      let telefone: string | null | undefined;

      if (colSexo && !valorVazio(row[colSexo])) {
        const s = normalizarSexo(row[colSexo]);
        if (!s) {
          erros.push({ linha: numeroLinha, coluna: colSexo, valor: row[colSexo], mensagem: 'Sexo inválido.' });
          linhaTemErro = true;
        } else {
          sexo = s;
        }
      }

      if (colNascimento && !valorVazio(row[colNascimento])) {
        const dn = normalizarData(row[colNascimento]);
        if (!dn) {
          erros.push({ linha: numeroLinha, coluna: colNascimento, valor: row[colNascimento], mensagem: 'Data de nascimento inválida.' });
          linhaTemErro = true;
        } else {
          nascimento = dn;
        }
      }

      if (colTelefone && !valorVazio(row[colTelefone])) {
        telefone = normalizarTelefone(row[colTelefone]);
      }

      if (!existente) {
        if (!nome) {
          erros.push({
            linha: numeroLinha,
            coluna: colNome ?? colCodigo ?? 'nome',
            valor: codigo ?? null,
            mensagem: 'Novo participante requer coluna de nome (ou código já existente no estudo).',
          });
          linhaTemErro = true;
        }
        if (!sexo) sexo = Sexo.OUTRO;
        if (!nascimento) nascimento = new Date(Date.UTC(1900, 0, 1));
        codigosNovos.add((codigo ?? nome ?? '').toLowerCase());
      } else {
        codigosExistentes.add(existente.codigo.toLowerCase());
      }

      const dataPadrao = data.dataVisitaPadrao ?? new Date();
      let dataVisitaLinha = dataPadrao;
      if (colVisitaData && !valorVazio(row[colVisitaData])) {
        const d = normalizarData(row[colVisitaData]);
        if (!d) {
          erros.push({ linha: numeroLinha, coluna: colVisitaData, valor: row[colVisitaData], mensagem: 'Data da visita inválida.' });
          linhaTemErro = true;
        } else {
          dataVisitaLinha = d;
        }
      }

      const visitasLinha: LinhaNormalizada['visitas'] = [];

      if (data.layout === 'long') {
        const tipoNomeRaw = colVisitaTipo ? row[colVisitaTipo] : undefined;
        const tvDef =
          !valorVazio(tipoNomeRaw)
            ? tvPorNome.get(normalizarTextoChave(String(tipoNomeRaw)))
            : resolverTv(data.tipoVisitaPadraoId, data.tipoVisitaPadraoNome);

        if (!tvDef) {
          erros.push({
            linha: numeroLinha,
            coluna: colVisitaTipo ?? 'visita_tipo',
            valor: tipoNomeRaw ?? null,
            mensagem: 'Tipo de visita não encontrado ou não informado.',
          });
          linhaTemErro = true;
        } else {
          const medicoes: MedicaoPreparada[] = [];
          for (const mapVar of colsVariaveis) {
            const varDef = resolverVar(mapVar);
            if (!varDef) {
              erros.push({
                linha: numeroLinha,
                coluna: mapVar.coluna,
                valor: row[mapVar.coluna],
                mensagem: 'Variável de destino não encontrada.',
              });
              linhaTemErro = true;
              continue;
            }
            const res = converterValorMedicao(varDef, row[mapVar.coluna], numeroLinha, mapVar.coluna);
            if (res === 'ERRO') linhaTemErro = true;
            else if (res !== null) medicoes.push(res);
          }

          visitasLinha.push({
            tipoVisitaChave: tvDef.chave,
            data: dataVisitaLinha,
            medicoes,
          });
        }
      } else {
        // Layout WIDE: agrupa colunas por tipoVisita
        const medicoesPorTv = new Map<string, MedicaoPreparada[]>();

        for (const mapVar of colsVariaveis) {
          const varDef = resolverVar(mapVar);
          const tvDef =
            resolverTv(mapVar.tipoVisitaId, mapVar.novoTipoVisitaNome) ??
            resolverTv(data.tipoVisitaPadraoId, data.tipoVisitaPadraoNome);

          if (!varDef || !tvDef) {
            erros.push({
              linha: numeroLinha,
              coluna: mapVar.coluna,
              valor: row[mapVar.coluna],
              mensagem: 'No modo wide, cada coluna de variável deve estar associada a uma variável e a um tipo de visita.',
            });
            linhaTemErro = true;
            continue;
          }

          const res = converterValorMedicao(varDef, row[mapVar.coluna], numeroLinha, mapVar.coluna);
          if (res === 'ERRO') {
            linhaTemErro = true;
          } else if (res !== null) {
            const lista = medicoesPorTv.get(tvDef.chave) ?? [];
            lista.push(res);
            medicoesPorTv.set(tvDef.chave, lista);
          }
        }

        for (const [tvChave, medicoes] of medicoesPorTv.entries()) {
          if (medicoes.length > 0) {
            visitasLinha.push({
              tipoVisitaChave: tvChave,
              data: dataVisitaLinha,
              medicoes,
            });
          }
        }
      }

      if (!linhaTemErro) {
        linhasNormalizadas.push({
          numeroLinha,
          participante: {
            ...(codigo !== undefined ? { codigo } : {}),
            ...(nome !== undefined ? { nome } : {}),
            ...(sexo !== undefined ? { sexo } : {}),
            ...(nascimento !== undefined ? { nascimento } : {}),
            ...(telefone !== undefined ? { telefone } : {}),
          },
          visitas: visitasLinha,
        });
      }
    }

    const totalMedicoes = linhasNormalizadas.reduce(
      (acc, l) => acc + l.visitas.reduce((a, v) => a + v.medicoes.length, 0),
      0
    );
    const totalVisitas = linhasNormalizadas.reduce((acc, l) => acc + l.visitas.length, 0);

    return {
      estudo,
      access,
      sessao,
      aba,
      linhasNormalizadas,
      erros,
      resumo: {
        totalLinhasArquivo: aba.linhas.length,
        linhasValidas: linhasNormalizadas.length,
        linhasComErro: aba.linhas.length - linhasNormalizadas.length,
        participantesNovosEstimados: codigosNovos.size,
        participantesExistentesEncontrados: codigosExistentes.size,
        visitasEstimadas: totalVisitas,
        medicoesEstimadas: totalMedicoes,
        novasVariaveisCriar: data.novasVariaveis.length,
        novosTiposVisitaCriar: data.novosTiposVisita.length,
      },
    };
  }

  async validar(userId: number, estudoId: number, data: ExecutarImportacaoInput) {
    const sim = await this.prepararSimulacao(userId, estudoId, data);
    return {
      valido: sim.erros.length === 0,
      resumo: sim.resumo,
      erros: sim.erros.slice(0, 100),
      totalErros: sim.erros.length,
    };
  }

  async confirmar(userId: number, estudoId: number, data: ExecutarImportacaoInput) {
    const sim = await this.prepararSimulacao(userId, estudoId, data);

    if (sim.estudo.status !== StatusEstudo.EM_ANDAMENTO) {
      throw new AppError(
        'STUDY_NOT_COLLECTING',
        'Para confirmar a importação de dados, o estudo deve estar com status EM_ANDAMENTO.',
        HttpStatus.CONFLICT
      );
    }

    if (sim.erros.length > 0 && !data.pularLinhasInvalidas) {
      throw new AppError(
        'IMPORT_VALIDATION_ERRORS',
        `Foram encontrados ${sim.erros.length} erros de validação. Corrija a planilha ou habilite pularLinhasInvalidas.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Criar novas variáveis e tipos de visita solicitados no mapeamento
      const mapaVarChaveId = new Map<string, number>();
      const varsAtuais = await tx.variavel.findMany({ where: { estudoId, deletedAt: null } });
      let nextVarOrdem = varsAtuais.reduce((m, v) => Math.max(m, v.ordem), -1) + 1;
      for (const v of varsAtuais) mapaVarChaveId.set(`id:${v.id}`, v.id);

      for (const nv of data.novasVariaveis) {
        const criada = await tx.variavel.create({
          data: {
            estudoId,
            nome: nv.nome,
            unidade: nv.unidade ?? null,
            dataType: nv.dataType,
            allowMultiple: nv.dataType === DataType.choice ? nv.allowMultiple : false,
            options: nv.dataType === DataType.choice ? serializeVariableOptions(nv.options) : null,
            ordem: nextVarOrdem++,
          },
        });
        mapaVarChaveId.set(`new:${nv.nome}`, criada.id);
      }

      const mapaTvChaveId = new Map<string, number>();
      const tvsAtuais = await tx.tipoVisita.findMany({ where: { estudoId, deletedAt: null } });
      let nextTvOrdem = tvsAtuais.reduce((m, t) => Math.max(m, t.ordem), -1) + 1;
      for (const t of tvsAtuais) mapaTvChaveId.set(`id:${t.id}`, t.id);

      for (const ntv of data.novosTiposVisita) {
        const criado = await tx.tipoVisita.create({
          data: {
            estudoId,
            nome: ntv.nome,
            descricao: ntv.descricao ?? null,
            ordem: nextTvOrdem++,
          },
        });
        mapaTvChaveId.set(`new:${ntv.nome}`, criado.id);
      }

      // 2. Cache de participações existentes
      const participacoesExistentes = await tx.participacaoEstudo.findMany({
        where: { estudoId, deletedAt: null },
        include: { participante: true },
      });

      const partPorCodigo = new Map(
        participacoesExistentes.map((p) => [p.codigo.toLowerCase(), p])
      );
      const partPorNome = new Map(
        participacoesExistentes.map((p) => [normalizarTextoChave(p.participante.nome), p])
      );

      let ultimoNumeroCodigo = 0;
      const todasParticipacoes = await tx.participacaoEstudo.findMany({
        where: { estudoId },
        select: { codigo: true },
      });
      for (const p of todasParticipacoes) {
        const parts = p.codigo.split('-');
        const n = parts[1] ? parseInt(parts[1], 10) : NaN;
        if (Number.isFinite(n) && n > ultimoNumeroCodigo) ultimoNumeroCodigo = n;
      }

      let participantesCriados = 0;
      let visitasCriadas = 0;
      let medicoesCriadas = 0;
      const visitasAfetadas = new Set<number>();
      const createdByLabel = `${sim.access.usuario.nome} (Importação)`;

      for (const linha of sim.linhasNormalizadas) {
        let participacao =
          (linha.participante.codigo
            ? partPorCodigo.get(linha.participante.codigo.toLowerCase())
            : undefined) ??
          (linha.participante.nome
            ? partPorNome.get(normalizarTextoChave(linha.participante.nome))
            : undefined);

        if (!participacao) {
          const participante = await tx.participante.create({
            data: {
              nome: linha.participante.nome ?? linha.participante.codigo ?? 'Sem Nome',
              telefone: linha.participante.telefone ?? null,
              sexo: linha.participante.sexo ?? Sexo.OUTRO,
              nascimento: linha.participante.nascimento ?? new Date(Date.UTC(1900, 0, 1)),
            },
          });

          let codigoFinal = linha.participante.codigo;
          if (!codigoFinal || partPorCodigo.has(codigoFinal.toLowerCase())) {
            ultimoNumeroCodigo += 1;
            codigoFinal = `${sim.estudo.sigla}-${ultimoNumeroCodigo.toString().padStart(3, '0')}`;
          }

          participacao = await tx.participacaoEstudo.create({
            data: {
              estudoId,
              participanteId: participante.id,
              codigo: codigoFinal,
            },
            include: { participante: true },
          });

          partPorCodigo.set(participacao.codigo.toLowerCase(), participacao);
          partPorNome.set(normalizarTextoChave(participante.nome), participacao);
          participantesCriados += 1;
        }

        for (const visitaData of linha.visitas) {
          const tipoVisitaId = mapaTvChaveId.get(visitaData.tipoVisitaChave);
          if (!tipoVisitaId) continue;

          let visita = await tx.visita.findUnique({
            where: {
              participacaoEstudoId_tipoVisitaId: {
                participacaoEstudoId: participacao.id,
                tipoVisitaId,
              },
            },
          });

          if (!visita) {
            visita = await tx.visita.create({
              data: {
                participacaoEstudoId: participacao.id,
                tipoVisitaId,
                data: visitaData.data,
                createdBy: createdByLabel,
              },
            });
            visitasCriadas += 1;
          } else if (visita.deletedAt !== null && data.politicaConflito === 'atualizar') {
            visita = await tx.visita.update({
              where: { id: visita.id },
              data: { deletedAt: null, data: visitaData.data },
            });
          }

          visitasAfetadas.add(visita.id);

          for (const med of visitaData.medicoes) {
            const variavelId = mapaVarChaveId.get(med.variavelChave);
            if (!variavelId) continue;

            const medExistente = await tx.medicao.findFirst({
              where: { visitaId: visita.id, variavelId },
            });

            if (!medExistente) {
              await tx.medicao.create({
                data: {
                  visitaId: visita.id,
                  variavelId,
                  valorNum: med.valorNum,
                  valorText: med.valorText,
                  createdBy: createdByLabel,
                },
              });
              medicoesCriadas += 1;
            } else if (data.politicaConflito === 'atualizar') {
              await tx.medicao.update({
                where: { id: medExistente.id },
                data: {
                  valorNum: med.valorNum,
                  valorText: med.valorText,
                  deletedAt: null,
                },
              });
              medicoesCriadas += 1;
            }
          }
        }
      }

      // 3. Recalcular variáveis calculadas para todas as visitas tocadas
      for (const visitaId of visitasAfetadas) {
        await FormulaEvaluationService.recalcularVisita(visitaId, tx);
      }

      // 4. Registrar auditoria
      const log = await tx.importacaoLog.create({
        data: {
          estudoId,
          usuarioId: sim.access.usuario.id,
          usuarioNome: sim.access.usuario.nome,
          nomeArquivo: sim.sessao.nomeArquivo,
          layout: data.layout,
          participantesCriados,
          visitasCriadas,
          medicoesCriadas,
          linhasIgnoradas: sim.aba.linhas.length - sim.linhasNormalizadas.length,
          resumo: {
            errosIgnorados: sim.erros.slice(0, 50),
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return log;
    });

    sessoesEmMemoria.delete(data.sessionId);
    return resultado;
  }

  async listarLogs(userId: number, estudoId: number) {
    await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canView(userId, estudoId);

    return prisma.importacaoLog.findMany({
      where: { estudoId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default ImportacaoService;
