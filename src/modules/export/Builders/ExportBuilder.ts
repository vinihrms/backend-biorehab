import { LinhaExportacao, ExportarEstudoInput } from "../schemas/export.schema";

class ExportBuilder {

    montar(estudo: any, opcoes: ExportarEstudoInput): LinhaExportacao[] {
    const linhas: LinhaExportacao[] = [];

    for (const participacao of estudo.participacoes) {

        for (const visita of participacao.visitas) {

            if (
                opcoes.incluirVisitas.length > 0 &&
                !opcoes.incluirVisitas.includes(visita.tipoVisitaId)
            ) {
                continue;
            }

            const linha: LinhaExportacao = {};

            if (opcoes.incluirParticipantes) {
                linha.codigo = participacao.codigo;
                linha.sexo = participacao.participante.sexo;
                linha.nascimento = participacao.participante.nascimento;
            }

            linha.visita = visita.tipoVisita.nome;
            linha.data = visita.data;

            let possuiVariavel = false;

            for (const medicao of visita.medicoes) {

                if (
                    opcoes.incluirVariaveis.length > 0 &&
                    !opcoes.incluirVariaveis.includes(medicao.variavelId)
                ) {
                    continue;
                }

                linha[medicao.variavel.nome] =
                    medicao.valorNum ?? medicao.valorText;

                possuiVariavel = true;
            }

            if (
                opcoes.incluirVariaveis.length > 0 &&
                !possuiVariavel
            ) {
                continue;
            }

            linhas.push(linha);
        }
    }

    return linhas;
}

}

export default ExportBuilder;