import { atualizarParticipanteSchema, CriarParticipanteInput, } from '../schemas/tipos_visita.schema';
import ParticipanteRepository from '../repositories/TiposVisitaRepository';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import TiposVisitaRepository from '../repositories/TiposVisitaRepository';
class TiposVisitaService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private tiposVisitaRepository = new TiposVisitaRepository();

    async listaPorEstudo(usuarioId: number, estudoId: number){
        await this.studyAuthorization.estudoExiste(estudoId);
        await this.studyAuthorization.canView(usuarioId, estudoId);

        await this.tiposVisitaRepository.listaTodosPorEstudo(estudoId);
    }
}

export default TiposVisitaService;
