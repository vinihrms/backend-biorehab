import { atualizarParticipanteSchema, CriarParticipanteInput, } from './../schemas/participante.schema';
import ParticipanteRepository from '../repositories/ParticipanteRepository';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
class ParticipanteService extends BaseService {
    private participanteRepository = new ParticipanteRepository();

    async create(data: CriarParticipanteInput, userId: number) {
        //const usuario = await this.adminAuthorization.isAdmin(userId);
        const participanteExistente = await this.participanteRepository.findByName(data.nome);

        if (participanteExistente) {
            throw new AppError('CONFLICT', 'Este participante já está cadastrado.', HttpStatus.CONFLICT);
        }
        if (data.nascimento > new Date()) {
            throw new AppError(
                'INVALID_BIRTH_DATE',
                'A data de nascimento não pode ser futura.',
                HttpStatus.BAD_REQUEST
            );
        }

        const participante = await this.participanteRepository.create(data);
        return participante;
    }

    async listar() {
        return this.participanteRepository.findAll();
    }

    async getById(participanteId: number) {
        const participante = await this.participanteRepository.findById(participanteId);

        if (!participante) {
            throw new AppError('PARTICIPANT_NOT_FOUND', 'Participante não encontrado.', HttpStatus.NOT_FOUND);
        }

        return participante;
    }

    async atualizar(participanteId: number, data: atualizarParticipanteSchema) {
        const participante = await this.participanteRepository.findById(participanteId);
        if (!participante) {
            throw new AppError('PARTICIPANT_NOT_FOUND', 'Participante não encontrado.', HttpStatus.NOT_FOUND);
        }

        if (data.nascimento && data.nascimento > new Date()) {
            throw new AppError(
                'INVALID_BIRTH_DATE',
                'A data de nascimento não pode ser futura.',
                HttpStatus.BAD_REQUEST
            );
        }

        return this.participanteRepository.update(participanteId, data);
    }

    async deletar(participanteId: number) {
        const participante = await this.participanteRepository.findById(participanteId);
        if (!participante) {
            throw new AppError('PARTICIPANT_NOT_FOUND', 'Participante não encontrado.', HttpStatus.NOT_FOUND);
        }

        return this.participanteRepository.softDelete(participanteId);
    }

    async buscarExcluidos() {
        return this.participanteRepository.findAllExcluidos();
    }

    async restaurar(participanteId: number) {
        const participante = await this.participanteRepository.findByIdIncludingDeleted(participanteId);
        if (!participante) {
            throw new AppError('PARTICIPANT_NOT_FOUND', 'participante não encontrado.', HttpStatus.NOT_FOUND);
        }
        
        if (participante.deletedAt === null) {
            throw new AppError(
                'PARTICIPANT_ALREADY_ACTIVE',
                'Este participante já está ativo.',
                HttpStatus.CONFLICT
            );
        }

        return this.participanteRepository.restaura(participanteId);


    }

}

export default ParticipanteService;
