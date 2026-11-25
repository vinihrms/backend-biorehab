import ExcelJS from 'exceljs';
import { ExportDataset } from '../Builders/ExportBuilder';

class XlsxExporter {
  async exportar(dataset: ExportDataset): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BioRehabLab';
    workbook.created = new Date();

    const sheetDados = workbook.addWorksheet('Dados', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    if (dataset.colunas.length > 0) {
      sheetDados.columns = dataset.colunas.map((col) => ({
        header: col,
        key: col,
        width: Math.min(40, Math.max(14, col.length + 4)),
      }));

      const headerRow = sheetDados.getRow(1);
      headerRow.font = { bold: true };

      for (const linha of dataset.linhas) {
        const rowValues: Record<string, unknown> = {};
        for (const col of dataset.colunas) {
          rowValues[col] = linha[col] ?? null;
        }
        const addedRow = sheetDados.addRow(rowValues);
        addedRow.eachCell((cell) => {
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      }

      sheetDados.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: dataset.colunas.length },
      };
    }

    const sheetDic = workbook.addWorksheet('Dicionario', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheetDic.columns = [
      { header: 'Ordem', key: 'ordem', width: 10 },
      { header: 'Variavel', key: 'nome', width: 28 },
      { header: 'Unidade', key: 'unidade', width: 14 },
      { header: 'Tipo', key: 'dataType', width: 14 },
      { header: 'Multipla Escolha', key: 'allowMultiple', width: 18 },
      { header: 'Opcoes', key: 'options', width: 36 },
      { header: 'Formula', key: 'formula', width: 36 },
    ];
    sheetDic.getRow(1).font = { bold: true };
    for (const item of dataset.dicionario) {
      sheetDic.addRow(item);
    }

    if (dataset.gruposVisiveis.length > 0) {
      const sheetGrupos = workbook.addWorksheet('Grupos_Metodos', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      sheetGrupos.columns = [
        { header: 'Grupo', key: 'nome', width: 28 },
        { header: 'Metodo / Descricao da Intervencao', key: 'descricaoMetodo', width: 60 },
      ];
      sheetGrupos.getRow(1).font = { bold: true };
      for (const g of dataset.gruposVisiveis) {
        sheetGrupos.addRow(g);
      }
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export default XlsxExporter;
