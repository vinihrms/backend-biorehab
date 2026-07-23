import { LinhaExportacao } from "../schemas/export.schema";

class ExportBuilder {

    montar(estudo: any): LinhaExportacao[] {

        const linhas: LinhaExportacao[] = [];

        for (const participacao of estudo.participacoes) {

            for (const visita of participacao.visitas) {

                const linha: LinhaExportacao = {
                    codigo: participacao.codigo,
                    participante: participacao.participante.nome,
                    sexo: participacao.participante.sexo,
                    nascimento: participacao.participante.nascimento,
                    visita: visita.tipoVisita.nome,
                    data: visita.data
                };

                for (const medicao of visita.medicoes) {

                    linha[medicao.variavel.nome] =
                        medicao.valorNum ?? medicao.valorText;

                }

                linhas.push(linha);
            }
        }

        return linhas;
    }

}

export default ExportBuilder;