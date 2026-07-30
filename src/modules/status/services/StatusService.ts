import { StatusEstudo } from '@prisma/client';
import AdminAuthorization from '../../../authorization/AdminAuthorization';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import StatusRepository from '../repositories/StatusRepository';
import { AlterarStatusInput } from '../schemas/status.schema';


class StatusService extends BaseService {

    private estudoRepository = new EstudoRepository;
    private studyAuthorization = new StudyAuthorization();
    private statusRepository = new StatusRepository()
    private adminAuthorization = new AdminAuthorization();

    async alterarStatus(userId: number, estudoId: number, data: AlterarStatusInput) {
        const estudo = await this.estudoRepository.findById(estudoId);

        if (!estudo) {
            throw new AppError('ESTUDO_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canManageStudy(userId, estudoId)

        return this.statusRepository.alterarStatus(estudoId, data.status as StatusEstudo);

    }

}

export default StatusService;
