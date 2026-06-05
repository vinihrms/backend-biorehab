import { Papel } from '@prisma/client';
import { BaseRepository } from '../../../repositories/base.repository';

class PermissaoEstudoRepository extends BaseRepository{
    async create(estudoId : number, usuarioId: number, papel: Papel){
        this.prisma.permissaoEstudo.create({
            data: {
                estudoId: estudoId,
                usuarioId: usuarioId,
                papel: papel
            }
        })
    }
}

export default PermissaoEstudoRepository;