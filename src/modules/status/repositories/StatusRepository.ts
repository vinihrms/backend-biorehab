import { StatusEstudo } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';
import { AlterarStatusInput } from '../schemas/status.schema';

class StatusRepository extends BaseRepository {


  async alterarStatus(id: number, status: StatusEstudo) {
    return this.prisma.estudo.update({
        where: { id },
        data: {
            status: status
        }
    });
}




}

export default StatusRepository;
