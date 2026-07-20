import { Prisma, ParticipacaoEstudo, Participante } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { atualizarParticipanteSchema, CriarParticipanteInput, criarParticipanteSchema } from '../schemas/tipos_visita.schema';

class TiposVisitaRepository extends BaseRepository {
  
  async listaTodosPorEstudo(estudoId: number){
    return this.prisma.tipoVisita.findMany({where: {
      estudoId, deletedAt: {not: null}
    }})
  }

}
export default TiposVisitaRepository;
