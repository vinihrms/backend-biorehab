import { Estudo } from "@prisma/client";
import AdminAuthorization from "../authorization/AdminAuthorization";
import StudyAuthorization from "../authorization/StudyAuthorization";
import { AppError } from "../errors/app-error";
import EstudoRepository from "../modules/estudos/repositories/EstudoRepository";
import { HttpStatus } from "../utils/http-status";

class StudyStatusValidation {
    async canEditStructure(estudo: Estudo) {
        if (estudo?.status != "PLANEJAMENTO") {
            throw new AppError(
                'STUDY_NOT_EDITABLE',
                'Este estudo não pode ser editado pois a coleta já foi iniciada.',
                HttpStatus.CONFLICT
            );
        }
    }

    async canCollectData(estudo: Estudo){
        if (estudo?.status != "EM_ANDAMENTO") {
            throw new AppError(
                'STUDY_NOT_COLLECTING',
                'Este estudo não está em fase de coleta.',
                HttpStatus.CONFLICT
            );
        }
    }

};

export default new StudyStatusValidation();