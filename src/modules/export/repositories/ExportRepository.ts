import { BaseRepository } from '../../../repositories/base.repository';

class ExportRepository extends BaseRepository {

    async buscarDadosDoEstudo(estudoId: number) {
        return this.prisma.estudo.findUnique({
            where: {
                id: estudoId
            },
            include: {
                participacoes: {
                    where: {
                        deletedAt: null
                    },
                    include: {
                        participante: true,
                        visitas: {
                            where: {
                                deletedAt: null
                            },
                            include: {
                                tipoVisita: true,
                                medicoes: {
                                    where: {
                                        deletedAt: null
                                    },
                                    include: {
                                        variavel: true
                                    }
                                }
                            },
                            orderBy: {
                                data: "asc"
                            }
                        }
                    }
                },

                variaveis: {
                    where: {
                        deletedAt: null
                    },
                    orderBy: {
                        nome: "asc"
                    }
                }
            }
        });
    }

}

export default ExportRepository;
