import { time } from "node:console";
import { BaseRepository } from "../../repositories/base.repository";
class UsuariosPendentesRepository extends BaseRepository {

    async findById(userId: number){
        return await this.prisma.usuario.findUnique({
            where: {
                id: userId,
                isActive: false
            }
        })
    }

    async findAll(){
        return await this.prisma.usuario.findMany({
            where: {
                isActive: false
            }, select: {
                id: true,
                nome: true,
                email: true,
                ra: true,
                isActive: true,
                createdAt: true,

            }
        });
    };

    async ativar(userId: number){
        return await this.prisma.usuario.update({
            where: {
                id: userId
            },
            data: {
                isActive: true
            }
        })
    }

    async hardDelete(userId: number){
        return await this.prisma.usuario.delete({
            where: {
                id: userId
            }
        })
    }
    

};

export default UsuariosPendentesRepository;
