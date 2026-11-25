import { LinhaExportacao } from '../schemas/export.schema';

class CsvExporter {
  exportar(
    colunas: string[],
    linhas: LinhaExportacao[],
    separador: ';' | ',' = ';'
  ): string {
    const bom = '\uFEFF';

    if (colunas.length === 0) {
      return bom;
    }

    const csv = [
      colunas.map((c) => this.escapar(c, separador)).join(separador),
      ...linhas.map((linha) =>
        colunas.map((coluna) => this.escapar(linha[coluna], separador)).join(separador)
      ),
    ];

    return bom + csv.join('\r\n');
  }

  private formatarDataIso(data: Date): string {
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private escapar(valor: unknown, separador: ';' | ','): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    const texto = valor instanceof Date ? this.formatarDataIso(valor) : String(valor);

    if (
      texto.includes(separador) ||
      texto.includes('"') ||
      texto.includes('\n') ||
      texto.includes('\r')
    ) {
      return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
  }
}

export default CsvExporter;
