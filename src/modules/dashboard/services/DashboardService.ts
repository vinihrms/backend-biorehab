import { Papel, StatusEstudo } from '@prisma/client';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import UsuarioRepository from '../../usuarios/repositories/UsuarioRepository';
import DashboardRepository, { AccessibleStudyRow } from '../repositories/DashboardRepository';

const LINKABLE_ROLES = new Set<Papel>([
  Papel.owner,
  Papel.study_admin,
  Papel.collector,
  Papel.interventionist,
]);

const MANAGER_ROLES = new Set<Papel>([Papel.owner, Papel.study_admin]);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

class DashboardService extends BaseService {
  private dashboardRepository = new DashboardRepository();
  private usuarioRepository = new UsuarioRepository();

  async obterResumo(userId: number) {
    const usuario = await this.usuarioRepository.findById(userId);
    if (!usuario || usuario.deletedAt !== null) {
      throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
    }

    const isAdmin = usuario.isAdmin;
    const estudos = await this.dashboardRepository.findAccessibleStudies(userId, isAdmin);
    const studyById = new Map<number, AccessibleStudyRow>();
    const studyIds: number[] = [];
    const linkableStudyIds: number[] = [];
    const planningManagedStudies: AccessibleStudyRow[] = [];

    const estudosPorStatus: Record<StatusEstudo, number> = {
      PLANEJAMENTO: 0,
      EM_ANDAMENTO: 0,
      COLETA_ENCERRADA: 0,
      ARQUIVADO: 0,
    };

    const estudosProntosParaRevelacao: Array<{
      estudoId: number;
      sigla: string;
      nome: string;
      status: StatusEstudo;
    }> = [];

    for (const estudo of estudos) {
      studyById.set(estudo.id, estudo);
      studyIds.push(estudo.id);
      estudosPorStatus[estudo.status] += 1;

      const podeVincular = isAdmin || (estudo.meuPapel !== null && LINKABLE_ROLES.has(estudo.meuPapel));
      if (podeVincular) {
        linkableStudyIds.push(estudo.id);
      }

      const podeGerenciar = isAdmin || (estudo.meuPapel !== null && MANAGER_ROLES.has(estudo.meuPapel));
      if (podeGerenciar && estudo.status === StatusEstudo.PLANEJAMENTO) {
        planningManagedStudies.push(estudo);
      }

      const podeRevelar = isAdmin || estudo.meuPapel === Papel.owner;
      const prontoParaRevelacao =
        estudo.estudoCego &&
        estudo.cegamentoQuebradoEm === null &&
        (estudo.status === StatusEstudo.COLETA_ENCERRADA || estudo.status === StatusEstudo.ARQUIVADO);

      if (podeRevelar && prontoParaRevelacao) {
        estudosProntosParaRevelacao.push({
          estudoId: estudo.id,
          sigla: estudo.sigla,
          nome: estudo.nome,
          status: estudo.status,
        });
      }
    }

    const planningManagedStudyIds = planningManagedStudies.map((e) => e.id);
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    const metrics = await this.dashboardRepository.getDashboardMetrics({
      isAdmin,
      studyIds,
      linkableStudyIds,
      planningManagedStudyIds,
      sevenDaysAgo,
    });

    const candidatosPorEstudo = metrics.candidatosAgrupados
      .map((row) => {
        const estudo = studyById.get(row.estudoId);
        if (!estudo) return null;
        return {
          estudoId: estudo.id,
          sigla: estudo.sigla,
          nome: estudo.nome,
          quantidade: row._count._all,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));

    const candidatosPendentesTotal = candidatosPorEstudo.reduce(
      (acc, item) => acc + item.quantidade,
      0
    );

    const variaveisCountByStudy = new Map<number, number>(
      metrics.variaveisAgrupadas.map((row) => [row.estudoId, row._count._all])
    );
    const tiposVisitaCountByStudy = new Map<number, number>(
      metrics.tiposVisitaAgrupados.map((row) => [row.estudoId, row._count._all])
    );

    const estudosPlanejamentoIncompletos = planningManagedStudies
      .map((estudo) => {
        const faltaVariaveis = (variaveisCountByStudy.get(estudo.id) ?? 0) === 0;
        const faltaTiposVisita = (tiposVisitaCountByStudy.get(estudo.id) ?? 0) === 0;
        if (!faltaVariaveis && !faltaTiposVisita) {
          return null;
        }
        return {
          estudoId: estudo.id,
          sigla: estudo.sigla,
          nome: estudo.nome,
          faltaVariaveis,
          faltaTiposVisita,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const ultimasVisitas = metrics.ultimasVisitasRaw.map((visita) => ({
      visitaId: visita.id,
      data: visita.data,
      estudoId: visita.participacaoEstudo.estudoId,
      estudoSigla: visita.participacaoEstudo.estudo.sigla,
      estudoNome: visita.participacaoEstudo.estudo.nome,
      participanteId: visita.participacaoEstudo.participanteId,
      participanteCodigo: visita.participacaoEstudo.codigo,
      tipoVisitaNome: visita.tipoVisita.nome,
    }));

    return {
      contadores: {
        estudosTotal: estudos.length,
        estudosPorStatus,
        participantesBaseTotal: metrics.participantesBaseTotal,
        visitasUltimos7Dias: metrics.visitasUltimos7Dias,
        medicoesUltimos7Dias: metrics.medicoesUltimos7Dias,
      },
      pendencias: {
        usuariosPendentes: metrics.usuariosPendentes,
        candidatosPendentesTotal,
        candidatosPorEstudo,
        estudosProntosParaRevelacao,
        estudosPlanejamentoIncompletos,
      },
      atividadeRecente: {
        ultimasVisitas,
      },
    };
  }
}

export default DashboardService;
