
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import ParticipacaoEstudoRepository from '../../participacao_estudo/repositories/ParticipacaoEstudoRepository';
import TiposVisitaRepository from '../../tipos_visita/repositories/TiposVisitaRepository';
import VisitaRepository from '../repositories/VisitaRepository';
import { AtualizarVisitaInput, CriarVisitaInput } from '../schemas/visita.schema';
class VisitaService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private participacaoRepository = new ParticipacaoEstudoRepository();
    private visitaRepository = new VisitaRepository();
    private tipoVisitaRepository = new TiposVisitaRepository();
    private estudoRepository = new EstudoRepository();
    private validacaoStatus = StudyStatusValidation;


    async estudoExiste(estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }
        return estudo;
    }

    private async participacaoExiste(participacaoId: number) {
        const participacao = await this.participacaoRepository.buscaParticipacaoPorId(participacaoId);
        if (!participacao) {
            throw new AppError('PARTICIPACAO_NOT_FOUND', 'Participação não encontrada.', HttpStatus.NOT_FOUND);
        }
        return participacao;
    }

    

    async listar(usuarioId: number, participacaoId: number) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        await this.studyAuthorization.canView(usuarioId, participacao.estudoId);

        return this.visitaRepository.listaPorParticipacao(participacaoId);
    }

    async listarExcluidas(usuarioId: number, participacaoId: number) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        await this.studyAuthorization.canView(usuarioId, participacao.estudoId);
        return this.visitaRepository.listarExcluidas(participacaoId);

    }

    async criar(usuarioId: number, participacaoId: number, data: CriarVisitaInput) {
        
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        await this.studyAuthorization.canLinkParticipant(usuarioId, participacao.estudoId);

        
        const tipoDeVisita = await this.tipoVisitaRepository.buscaPorId(participacao.estudoId, data.tipoVisitaId);
        if (!tipoDeVisita) {
            throw new AppError('TIPO_VISITA_NOT_FOUND', 'Tipo de visita não encontrado.', HttpStatus.NOT_FOUND);
        }
        const estudo = await this.estudoExiste(tipoDeVisita.estudoId);

        await this.validacaoStatus.canCollectData(estudo);

        if (tipoDeVisita.estudoId !== participacao.estudoId) {
            throw new AppError('TIPO_VISITA_NOT_MATHCES', 'O tipo de visita não pertence a este estudo.', HttpStatus.BAD_REQUEST);
        }

        if (await this.visitaRepository.existeMesmoTipo(participacaoId, tipoDeVisita.id)) {
            throw new AppError('VISITA_ALREADY_EXISTS', 'Uma visita deste tipo para esta participação já foi cadastrada.', HttpStatus.CONFLICT);
        }
        if (await this.visitaRepository.existeMesmoTipoIncluindoExcluidas(participacaoId, tipoDeVisita.id)) {
            throw new AppError('VISITA_DELETED_EXISTS', 'Uma visita deste tipo para esta participação já existe mas esta excluída.', HttpStatus.CONFLICT);
        }

        return this.visitaRepository.criar(participacaoId, usuarioId, data)
    }

    async buscarPorId(usuarioId: number, participacaoId: number, visitaId: number) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(usuarioId, participacao.estudoId);

        const visita = await this.visitaRepository.buscaPorId(participacaoId, visitaId);
        if (!visita) {
            throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
        }

        return visita;
    }

    async atualizar(usuarioId: number, participacaoId: number, visitaId: number, data: AtualizarVisitaInput) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, participacao.estudoId);

        const visita = await this.visitaRepository.buscaPorId(participacaoId, visitaId);
        if (!visita) {
            throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
        }

        return this.visitaRepository.atualizar(visitaId, data);
    }

    async deletar(usuarioId: number, participacaoId: number, visitaId: number) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, participacao.estudoId);

        const visita = await this.visitaRepository.buscaPorId(participacaoId, visitaId);
        if (!visita) {
            throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
        }

        return this.visitaRepository.apagar(visitaId);
    }

    async restaurar(usuarioId: number, participacaoId: number, visitaId: number) {
        const participacao = await this.participacaoExiste(participacaoId);
        if (participacao.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, participacao.estudoId);

        const visita = await this.visitaRepository.buscaPorIdComDeletado(participacaoId, visitaId);
        if (!visita) {
            throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
        }
        if (visita?.deletedAt == null) {
            throw new AppError('VISITA_ALREADY_ACTIVE', 'Visita já está ativa.', HttpStatus.CONFLICT);
        }

        return this.visitaRepository.restaurar(visitaId);
    }

}

export default VisitaService;
