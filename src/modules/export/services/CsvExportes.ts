import { LinhaExportacao } from "../schemas/export.schema";

class CsvExporter {

    exportar(linhas: LinhaExportacao[]): string {

        if (linhas.length === 0) {
            return "";
        }

        const cabecalho = Object.keys(linhas[0]!);
          
        const csv = [
            cabecalho.join(","),
            ...linhas.map(linha =>
                cabecalho
                    .map(coluna => this.escapar(linha[coluna]))
                    .join(",")
            )
        ];

        return csv.join("\n");
    }

    private escapar(valor: unknown): string {

        if (valor === null || valor === undefined) {
            return "";
        }

        const texto = String(valor);

        if (
            texto.includes(",") ||
            texto.includes('"') ||
            texto.includes("\n")
        ) {
            return `"${texto.replace(/"/g, '""')}"`;
        }

        return texto;
    }
}

export default CsvExporter;