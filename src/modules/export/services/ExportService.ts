import StudyAuthorization from "../../../authorization/StudyAuthorization";
import { BaseService } from "../../../services/base.service";
import ExportBuilder from "../Builders/ExportBuilder";

import ExportRepository from "../repositories/ExportRepository";

import { ExportarEstudoInput } from "../schemas/export.schema";
import CsvExporter from "./CsvExportes";

class ExportService extends BaseService {

    private studyAuthorization = new StudyAuthorization();
    private exportRepository = new ExportRepository();
    private exportBuilder = new ExportBuilder();
    private csvExporter = new CsvExporter();

    async exportar(
        usuarioId: number,
        estudoId: number,
        data: ExportarEstudoInput
    ) {

        await this.studyAuthorization.estudoExiste(estudoId);

        await this.studyAuthorization.canView(usuarioId, estudoId);

        const estudo =
            await this.exportRepository.buscarDadosDoEstudo(estudoId);

        const linhas =
            this.exportBuilder.montar(estudo);

        switch (data.formato) {

            case "csv":
                return this.csvExporter.exportar(linhas);

            case "xlsx":
                throw new Error("Formato XLSX ainda não implementado");
        }
    }
}

export default ExportService;