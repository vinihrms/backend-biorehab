import { DataType } from '@prisma/client';
import AdminAuthorization from '../../../authorization/AdminAuthorization';
import StudyAuthorization from '../../../authorization/StudyAuthorization';
import prisma from '../../../config/prisma';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { parseVariableOptions, serializeVariableOptions } from '../../../utils/choice-options';
import { HttpStatus } from '../../../utils/http-status';
import StudyStatusValidation from '../../../validation/StudyStatusValidation';
import TiposVisitaRepository from '../../tipos_visita/repositories/TiposVisitaRepository';
import VariavelRepository from '../../variaveis/repositories/VariavelRepository';
import {
  AtualizarCatalogoTipoVisitaInput,
  AtualizarCatalogoVariavelInput,
  CriarCatalogoTipoVisitaInput,
  CriarCatalogoVariavelInput,
  ImportarTiposVisitaEstudoInput,
  ImportarVariaveisEstudoInput,
} from '../schemas/catalogo.schema';

class CatalogoService extends BaseService {
  private adminAuthorization = new AdminAuthorization();
  private studyAuthorization = new StudyAuthorization();
  private variavelRepository = new VariavelRepository();
  private tiposVisitaRepository = new TiposVisitaRepository();

  // ==================== CATÁLOGO DE VARIÁVEIS ====================

  async listarVariaveisCatalogo(termo?: string) {
    const q = termo?.trim();
    const itens = await prisma.catalogoVariavel.findMany({
      where: {
        deletedAt: null,
        ...(q ? { nome: { contains: q } } : {}),
      },
      orderBy: { nome: 'asc' },
    });

    return itens.map((item) => ({
      ...item,
      optionsList: parseVariableOptions(item.options),
    }));
  }

  async criarVariavelCatalogo(userId: number, data: CriarCatalogoVariavelInput) {
    await this.adminAuthorization.isAdmin(userId);

    const existente = await prisma.catalogoVariavel.findUnique({ where: { nome: data.nome } });
    if (existente && existente.deletedAt === null) {
      throw new AppError(
        'CATALOGO_VARIAVEL_EXISTS',
        'Já existe uma variável com este nome no catálogo oficial.',
        HttpStatus.CONFLICT
      );
    }

    const serializedOptions =
      data.dataType === DataType.choice ? serializeVariableOptions(data.options) : null;
    if (data.dataType === DataType.choice && !serializedOptions) {
      throw new AppError(
        'INVALID_OPTIONS',
        'Variáveis de escolha exigem ao menos uma opção.',
        HttpStatus.BAD_REQUEST
      );
    }

    const created = existente
      ? await prisma.catalogoVariavel.update({
          where: { id: existente.id },
          data: {
            unidade: data.unidade ?? null,
            dataType: data.dataType,
            allowMultiple: data.dataType === DataType.choice ? (data.allowMultiple ?? false) : false,
            options: serializedOptions,
            descricao: data.descricao ?? null,
            deletedAt: null,
          },
        })
      : await prisma.catalogoVariavel.create({
          data: {
            nome: data.nome,
            unidade: data.unidade ?? null,
            dataType: data.dataType,
            allowMultiple: data.dataType === DataType.choice ? (data.allowMultiple ?? false) : false,
            options: serializedOptions,
            descricao: data.descricao ?? null,
          },
        });

    return { ...created, optionsList: parseVariableOptions(created.options) };
  }

  async atualizarVariavelCatalogo(
    userId: number,
    id: number,
    data: AtualizarCatalogoVariavelInput
  ) {
    await this.adminAuthorization.isAdmin(userId);

    const atual = await prisma.catalogoVariavel.findFirst({ where: { id, deletedAt: null } });
    if (!atual) {
      throw new AppError(
        'CATALOGO_VARIAVEL_NOT_FOUND',
        'Variável de catálogo não encontrada.',
        HttpStatus.NOT_FOUND
      );
    }

    if (data.nome && data.nome !== atual.nome) {
      const conflito = await prisma.catalogoVariavel.findUnique({ where: { nome: data.nome } });
      if (conflito) {
        throw new AppError('CONFLICT', 'Já existe uma variável de catálogo com este nome.', HttpStatus.CONFLICT);
      }
    }

    const updated = await prisma.catalogoVariavel.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.unidade !== undefined ? { unidade: data.unidade ?? null } : {}),
        ...(data.dataType !== undefined ? { dataType: data.dataType } : {}),
        ...(data.allowMultiple !== undefined ? { allowMultiple: data.allowMultiple } : {}),
        ...(data.options !== undefined ? { options: serializeVariableOptions(data.options) } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao ?? null } : {}),
      },
    });

    return { ...updated, optionsList: parseVariableOptions(updated.options) };
  }

  async deletarVariavelCatalogo(userId: number, id: number) {
    await this.adminAuthorization.isAdmin(userId);

    const atual = await prisma.catalogoVariavel.findFirst({ where: { id, deletedAt: null } });
    if (!atual) {
      throw new AppError(
        'CATALOGO_VARIAVEL_NOT_FOUND',
        'Variável de catálogo não encontrada.',
        HttpStatus.NOT_FOUND
      );
    }

    await prisma.catalogoVariavel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async promoverVariavelAoCatalogo(userId: number, estudoId: number, variavelId: number) {
    await this.adminAuthorization.isAdmin(userId);
    const variavel = await prisma.variavel.findFirst({
      where: { id: variavelId, estudoId, deletedAt: null },
    });

    if (!variavel) {
      throw new AppError('VARIAVEL_NOT_FOUND', 'Variável não encontrada neste estudo.', HttpStatus.NOT_FOUND);
    }

    if (variavel.dataType === DataType.calculated) {
      throw new AppError(
        'INVALID_CATALOG_TYPE',
        'Variáveis calculadas dependem de IDs específicos do estudo e não podem ser promovidas diretamente.',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.criarVariavelCatalogo(userId, {
      nome: variavel.nome,
      unidade: variavel.unidade,
      dataType: variavel.dataType,
      allowMultiple: variavel.allowMultiple,
      options: variavel.options,
    });
  }

  // ==================== CATÁLOGO DE TIPOS DE VISITA ====================

  async listarTiposVisitaCatalogo(termo?: string) {
    const q = termo?.trim();
    return prisma.catalogoTipoVisita.findMany({
      where: {
        deletedAt: null,
        ...(q ? { nome: { contains: q } } : {}),
      },
      orderBy: { nome: 'asc' },
    });
  }

  async criarTipoVisitaCatalogo(userId: number, data: CriarCatalogoTipoVisitaInput) {
    await this.adminAuthorization.isAdmin(userId);

    const existente = await prisma.catalogoTipoVisita.findUnique({ where: { nome: data.nome } });
    if (existente && existente.deletedAt === null) {
      throw new AppError(
        'CATALOGO_TIPO_VISITA_EXISTS',
        'Já existe um tipo de visita com este nome no catálogo oficial.',
        HttpStatus.CONFLICT
      );
    }

    if (existente) {
      return prisma.catalogoTipoVisita.update({
        where: { id: existente.id },
        data: { descricao: data.descricao ?? null, deletedAt: null },
      });
    }

    return prisma.catalogoTipoVisita.create({
      data: { nome: data.nome, descricao: data.descricao ?? null },
    });
  }

  async atualizarTipoVisitaCatalogo(
    userId: number,
    id: number,
    data: AtualizarCatalogoTipoVisitaInput
  ) {
    await this.adminAuthorization.isAdmin(userId);

    const atual = await prisma.catalogoTipoVisita.findFirst({ where: { id, deletedAt: null } });
    if (!atual) {
      throw new AppError(
        'CATALOGO_TIPO_VISITA_NOT_FOUND',
        'Tipo de visita de catálogo não encontrado.',
        HttpStatus.NOT_FOUND
      );
    }

    if (data.nome && data.nome !== atual.nome) {
      const conflito = await prisma.catalogoTipoVisita.findUnique({ where: { nome: data.nome } });
      if (conflito) {
        throw new AppError('CONFLICT', 'Já existe um tipo de visita de catálogo com este nome.', HttpStatus.CONFLICT);
      }
    }

    return prisma.catalogoTipoVisita.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao ?? null } : {}),
      },
    });
  }

  async deletarTipoVisitaCatalogo(userId: number, id: number) {
    await this.adminAuthorization.isAdmin(userId);

    const atual = await prisma.catalogoTipoVisita.findFirst({ where: { id, deletedAt: null } });
    if (!atual) {
      throw new AppError(
        'CATALOGO_TIPO_VISITA_NOT_FOUND',
        'Tipo de visita de catálogo não encontrado.',
        HttpStatus.NOT_FOUND
      );
    }

    await prisma.catalogoTipoVisita.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== IMPORTAÇÃO PARA ESTUDOS (SNAPSHOT) ====================

  async importarVariaveisParaEstudo(
    userId: number,
    estudoId: number,
    data: ImportarVariaveisEstudoInput
  ) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await StudyStatusValidation.canEditStructure(estudo);

    const existentesNoDestino = await this.variavelRepository.findAllByStudy(estudoId);
    const nomesExistentes = new Set(existentesNoDestino.map((v) => v.nome.toLowerCase()));
    let proximaOrdem = await this.variavelRepository.getNextOrdem(estudoId);

    const criadas = [];
    const ignoradas: Array<{ nome: string; motivo: string }> = [];

    if (data.catalogoIds && data.catalogoIds.length > 0) {
      const itensCatalogo = await prisma.catalogoVariavel.findMany({
        where: { id: { in: data.catalogoIds }, deletedAt: null },
        orderBy: { nome: 'asc' },
      });

      for (const item of itensCatalogo) {
        if (nomesExistentes.has(item.nome.toLowerCase())) {
          ignoradas.push({ nome: item.nome, motivo: 'Já existe no estudo destino.' });
          continue;
        }

        const criada = await this.variavelRepository.criar(
          {
            nome: item.nome,
            unidade: item.unidade,
            dataType: item.dataType,
            allowMultiple: item.allowMultiple,
            options: item.options,
          },
          estudoId,
          proximaOrdem++,
          item.id
        );
        nomesExistentes.add(criada.nome.toLowerCase());
        criadas.push(criada);
      }
    }

    if (data.origemEstudoId !== undefined) {
      await this.studyAuthorization.estudoExiste(data.origemEstudoId);
      await this.studyAuthorization.canView(userId, data.origemEstudoId);

      const varsOrigem = await prisma.variavel.findMany({
        where: {
          estudoId: data.origemEstudoId,
          deletedAt: null,
          ...(data.variavelIds && data.variavelIds.length > 0
            ? { id: { in: data.variavelIds } }
            : {}),
        },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      });

      for (const orig of varsOrigem) {
        if (nomesExistentes.has(orig.nome.toLowerCase())) {
          ignoradas.push({ nome: orig.nome, motivo: 'Já existe no estudo destino.' });
          continue;
        }

        if (orig.dataType === DataType.calculated) {
          ignoradas.push({
            nome: orig.nome,
            motivo: 'Variável calculada deve ser reconfigurada com os IDs das variáveis do novo estudo.',
          });
          continue;
        }

        const criada = await this.variavelRepository.criar(
          {
            nome: orig.nome,
            unidade: orig.unidade,
            dataType: orig.dataType,
            allowMultiple: orig.allowMultiple,
            options: orig.options,
          },
          estudoId,
          proximaOrdem++,
          orig.catalogoVariavelId
        );
        nomesExistentes.add(criada.nome.toLowerCase());
        criadas.push(criada);
      }
    }

    return { criadas, ignoradas };
  }

  async importarTiposVisitaParaEstudo(
    userId: number,
    estudoId: number,
    data: ImportarTiposVisitaEstudoInput
  ) {
    const estudo = await this.studyAuthorization.estudoExiste(estudoId);
    await this.studyAuthorization.canManageStudy(userId, estudoId);
    await StudyStatusValidation.canEditStructure(estudo);

    const existentesNoDestino = await this.tiposVisitaRepository.listaTodosPorEstudo(estudoId);
    const nomesExistentes = new Set(existentesNoDestino.map((t) => t.nome.toLowerCase()));
    let proximaOrdem = await this.tiposVisitaRepository.getNextOrdem(estudoId);

    const criadas = [];
    const ignoradas: Array<{ nome: string; motivo: string }> = [];

    if (data.catalogoIds && data.catalogoIds.length > 0) {
      const itensCatalogo = await prisma.catalogoTipoVisita.findMany({
        where: { id: { in: data.catalogoIds }, deletedAt: null },
        orderBy: { nome: 'asc' },
      });

      for (const item of itensCatalogo) {
        if (nomesExistentes.has(item.nome.toLowerCase())) {
          ignoradas.push({ nome: item.nome, motivo: 'Já existe no estudo destino.' });
          continue;
        }

        const criado = await this.tiposVisitaRepository.criar(
          estudoId,
          { nome: item.nome, descricao: item.descricao },
          proximaOrdem++,
          item.id
        );
        nomesExistentes.add(criado.nome.toLowerCase());
        criadas.push(criado);
      }
    }

    if (data.origemEstudoId !== undefined) {
      await this.studyAuthorization.estudoExiste(data.origemEstudoId);
      await this.studyAuthorization.canView(userId, data.origemEstudoId);

      const tiposOrigem = await prisma.tipoVisita.findMany({
        where: {
          estudoId: data.origemEstudoId,
          deletedAt: null,
          ...(data.tipoVisitaIds && data.tipoVisitaIds.length > 0
            ? { id: { in: data.tipoVisitaIds } }
            : {}),
        },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      });

      for (const orig of tiposOrigem) {
        if (nomesExistentes.has(orig.nome.toLowerCase())) {
          ignoradas.push({ nome: orig.nome, motivo: 'Já existe no estudo destino.' });
          continue;
        }

        const criado = await this.tiposVisitaRepository.criar(
          estudoId,
          { nome: orig.nome, descricao: orig.descricao },
          proximaOrdem++,
          orig.catalogoTipoVisitaId
        );
        nomesExistentes.add(criado.nome.toLowerCase());
        criadas.push(criado);
      }
    }

    return { criadas, ignoradas };
  }
}

export default CatalogoService;
