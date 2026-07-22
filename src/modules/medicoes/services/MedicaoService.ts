import StudyAuthorization from '../../../authorization/StudyAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import VariavelRepository from '../../variaveis/repositories/VariavelRepository';
import VisitaRepository from '../../visitas/repositories/VisitaRepository';

import { AtualizarMedicaoInput, CriarMedicaoInput } from '../schemas/medicao.schema';
import MedicaoRepository from '../repositories/MedicaoRepository';
import { Variavel } from '@prisma/client';

class MedicaoService extends BaseService {
    private studyAuthorization = new StudyAuthorization();
    private visitaRepository = new VisitaRepository();
    private variavelRepository = new VariavelRepository();
    private medicaoRepository = new MedicaoRepository();


    private async visitaExiste(visitaId: number) {
        const visita = await this.visitaRepository.buscaVisitaPorId(visitaId);
        if (!visita) {
            throw new AppError('VISITA_NOT_FOUND', 'Visita não encontrada.', HttpStatus.NOT_FOUND);
        }
        return visita;
    }

    private async variavelExiste(variavelId: number) {
        const variavel = await this.variavelRepository.findById(variavelId);
        if (!variavel) {
            throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada.', HttpStatus.NOT_FOUND);
        }
        return variavel;
    }


    private validarValorDaVariavel(variavel: Variavel, data: CriarMedicaoInput | AtualizarMedicaoInput) {
        const erro = (mensagem: string): never => {
            throw new AppError(
                'INVALID_MEASUREMENT_VALUE',
                mensagem,
                HttpStatus.BAD_REQUEST
            );
        };

        switch (variavel.dataType) {
            case "numeric":
                if (data.valorNum === undefined) {
                    erro('Valor numérico não informado.');
                }

                if (data.valorText !== undefined) {
                    erro('Valor textual informado para variável numérica.');
                }

                break;

            case "integer":
                if (data.valorNum === undefined) {
                    erro('Valor inteiro não informado.');
                }

                if (!Number.isInteger(data.valorNum)) {
                    erro('Valor informado não é um inteiro.');
                }

                if (data.valorText !== undefined) {
                    erro('Valor textual informado para variável inteira.');
                }

                break;

            case "text":
                if (data.valorText === undefined) {
                    erro('Valor textual não informado.');
                }

                if (data.valorNum !== undefined) {
                    erro('Valor numérico informado para variável textual.');
                }

                break;

            case "boolean":
                if (data.valorText === undefined) {
                    erro('Valor booleano não informado.');
                }

                if (data.valorNum !== undefined) {
                    erro('Valor numérico informado para variável booleana.');
                }

                if (data.valorText !== "true" && data.valorText !== "false") {
                    erro('Valor booleano inválido. Informe true ou false.');
                }

                break;

            case "choice":
                if (data.valorText === undefined) {
                    erro('Opção não informada.');
                }

                if (data.valorNum !== undefined) {
                    erro('Valor numérico informado para variável de escolha.');
                }

                const opcoes = variavel.options
                    ?.split(',')
                    .map(opcao => opcao.trim());

                if (!opcoes || !opcoes.includes(data.valorText!)) {
                    erro('Valor informado não está entre as opções permitidas.');
                }

                break;
        }
    }

    async listar(usuarioId: number, visitaId: number) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);

        return this.medicaoRepository.listarPorVisita(visitaId);
    }

    async listarExcluidas(usuarioId: number, visitaId: number) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);

        return this.medicaoRepository.listarExcluidas(visitaId);

    }

    async criar(usuarioId: number, visitaId: number, data: CriarMedicaoInput) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }
        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, visita.participacaoEstudo.estudoId);

        const variavel = await this.variavelExiste(data.variavelId);
        if (variavel.deletedAt) {
            throw new AppError('VARIAVEL_DELETED', 'Variável encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        if (variavel.estudoId !== visita.participacaoEstudo.estudoId) {
            throw new AppError('VARIAVEL_NOT_PERTENCE', 'Variável não pertence a este estudo.', HttpStatus.BAD_REQUEST);
        }

        const medicaoExiste = await this.medicaoRepository.existeMesmaVariavel(visitaId, variavel.id);

        if (medicaoExiste) {
            throw new AppError('MEDICAO_ALREADY_EXISTS', 'Já existe uma medição para esta visita e variável.', HttpStatus.CONFLICT);
        }

        const medicaoDeletadaExiste = await this.medicaoRepository.existeMesmaVariavelcomDeleted(visitaId, variavel.id);
        if (medicaoDeletadaExiste) {
            throw new AppError('DELETED_MEDICAO_ALREADY_EXISTS', 'Já existe uma medição deletada para esta visita e variável.', HttpStatus.CONFLICT);
        }

        this.validarValorDaVariavel(variavel, data);

        return this.medicaoRepository.criar(visitaId, usuarioId, data);



    }

    async buscarPorId(usuarioId: number, visitaId: number, medicaoId: number) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canView(usuarioId, visita.participacaoEstudo.estudoId);

        const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
        if (!medicao) {
            throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
        }

        return medicao;
    }

    async atualizar(usuarioId: number, visitaId: number, medicaoId: number, data: AtualizarMedicaoInput) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, visita.participacaoEstudo.estudoId);
        
        const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
        if (!medicao) {
            throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
        }

        this.validarValorDaVariavel(medicao.variavel, data);

        return this.medicaoRepository.atualizar(medicaoId, data);
    }

    async deletar(usuarioId: number, visitaId: number, medicaoId: number) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, visita.participacaoEstudo.estudoId);
        
        const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
        if (!medicao) {
            throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
        }

        if (medicao.deletedAt) {
            throw new AppError('MEDICAO_ALREADY_DELETED', 'Medição já se encontra deletada.', HttpStatus.CONFLICT);
        }

        return this.medicaoRepository.apagar(medicaoId);
    }

    async restaurar(usuarioId: number, visitaId: number, medicaoId: number) {
        const visita = await this.visitaExiste(visitaId);
        if (visita.deletedAt) {
            throw new AppError('VISITA_DELETED', 'Visita encontra-se excluida.', HttpStatus.NOT_FOUND);
        }   

        if (visita.participacaoEstudo.deletedAt) {
            throw new AppError('PARTICIPACAO_DELETED', 'Participação encontra-se excluida.', HttpStatus.NOT_FOUND);
        }

        await this.studyAuthorization.canLinkParticipant(usuarioId, visita.participacaoEstudo.estudoId);
        
        const medicao = await this.medicaoRepository.buscaPorId(visitaId, medicaoId);
        if (!medicao) {
            throw new AppError('MEDICAO_NOT_FOUND', 'Medição não encontrada.', HttpStatus.NOT_FOUND);
        }

        if (medicao.deletedAt == null) {
            throw new AppError('MEDICAO_ALREADY_ACTIVE', 'Medição já está ativa.', HttpStatus.CONFLICT);
        }

        return this.medicaoRepository.restaurar(medicaoId);
    }

}

export default MedicaoService;
