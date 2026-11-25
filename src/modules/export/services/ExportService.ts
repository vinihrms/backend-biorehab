import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { BaseService } from '../../../services/base.service';
import ExportBuilder from '../Builders/ExportBuilder';
import ExportRepository from '../repositories/ExportRepository';
import { ExportarEstudoInput } from '../schemas/export.schema';
import CsvExporter from './CsvExportes';
import XlsxExporter from './XlsxExporter';

export type ExportResult = {
  contentType: string;
  filename: string;
  content: string | Buffer;
};

class ExportService extends BaseService {
  private studyAuthorization = new StudyAuthorization();
  private exportRepository = new ExportRepository();
  private exportBuilder = new ExportBuilder();
  private csvExporter = new CsvExporter();
  private xlsxExporter = new XlsxExporter();

  async exportar(
    usuarioId: number,
    estudoId: number,
    data: ExportarEstudoInput
  ): Promise<ExportResult> {
    const estudoMeta = await this.studyAuthorization.estudoExiste(estudoId);
    const blinding = await this.studyAuthorization.getBlindingVisibility(usuarioId, estudoMeta);

    const estudo = await this.exportRepository.buscarDadosDoEstudo(estudoId);
    const dataset = this.exportBuilder.montar(estudo, data, {
      canViewAll: blinding.canViewAll,
      canViewOnlyUnblinded: blinding.canViewOnlyUnblinded,
    });

    const sufixoLayout = data.layout === 'wide' ? 'curto' : 'longo';

    if (data.formato === 'xlsx') {
      const buffer = await this.xlsxExporter.exportar(dataset);
      return {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `estudo-${estudoId}-${sufixoLayout}.xlsx`,
        content: buffer,
      };
    }

    const csv = this.csvExporter.exportar(dataset.colunas, dataset.linhas, data.separadorCsv);
    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `estudo-${estudoId}-${sufixoLayout}.csv`,
      content: csv,
    };
  }
}

export default ExportService;
