import { criarParticipacaoEstudo, CriarParticipacaoInput } from './../schemas/participacao_estudo.schema';
import { ParticipacaoEstudo } from '@prisma/client';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import ParticipacaoEstudoRepository from '../repositories/ParticipacaoEstudoRepository';
import EstudoRepository from '../../estudos/repositories/EstudoRepository';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { userInfo } from 'node:os';
import ParticipanteRepository from '../../participantes/repositories/ParticipanteRepository';
class ParticipacaoEstudoService extends BaseService {
    private participacaoEstudoRepository = new ParticipacaoEstudoRepository();
    private estudoRepository = new EstudoRepository();
    private studyAuthorization = new StudyAuthorization();
    private participanteRepository = new ParticipanteRepository();

    async estudoExiste(estudoId: number) {
        const estudo = await this.estudoRepository.findById(estudoId);
        if (!estudo) {
            throw new AppError('STUDY_NOT_FOUND', 'Estudo não encontrado.', HttpStatus.NOT_FOUND);
        }
        return estudo;
    }

    private async gerarCodigo(estudoId: number, sigla: string): Promise<string> {
        const ultimaParticipacao =
            await this.participacaoEstudoRepository.buscarUltimaParticipacao(estudoId);

        const codigo = ultimaParticipacao?.codigo;

        if (!codigo) {
            return `${sigla}-001`;
        }

        const partes = codigo.split("-");

        if (partes.length !== 2) {
            throw new Error("Código do participante inválido.");
        }

        const numeroAtual = parseInt(partes[1]!, 10);

        const proximoNumero = numeroAtual + 1;

        return `${sigla}-${proximoNumero.toString().padStart(3, "0")}`;
    }

    async listar(usuarioId: number, estudoId: number) {
        await this.estudoExiste(estudoId);
        await this.studyAuthorization.canView(usuarioId, estudoId);

        const participantes = await this.participacaoEstudoRepository.listaPorEstudo(estudoId);

        return participantes;
    }

    async vincularAoEstudo(usuarioId: number, estudoId: number, dadosValidados: CriarParticipacaoInput) {
        const estudo = await this.estudoExiste(estudoId);
        await this.studyAuthorization.canLinkParticipant(usuarioId, estudoId);

        const codigo = await this.gerarCodigo(estudo.id, estudo.sigla);

        const participacaoEstudo = await this.participacaoEstudoRepository.vincularAoEstudo(estudoId, dadosValidados, codigo);

        return participacaoEstudo;
    }

    async desvincularAoEstudo(usuarioId: number, estudoId: number, partiticipanteId: number) {
        await this.estudoExiste(estudoId);
        await this.studyAuthorization.canLinkParticipant(usuarioId, estudoId);


        const estaNoEstudo = await this.participacaoEstudoRepository.buscaParticipacao(estudoId, partiticipanteId)

        if (!estaNoEstudo) {
            throw new AppError('PARTICIPANTE_NOT_VINCULADO', 'Participante não está vinculado a este estudo.', HttpStatus.NOT_FOUND);
        }

        //TODO: Fazer verificação se há dados vinculados a este participante

        const participacaoEstudo = await this.participacaoEstudoRepository.desvincularAoEstudo(estudoId, partiticipanteId);

        return participacaoEstudo;
    }
}

export default ParticipacaoEstudoService;
