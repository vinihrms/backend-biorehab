import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import AdminAuthorization from '../../../authorization/AdminAuthorization';
import { AppError } from '../../../errors/app-error';
import { BaseService } from '../../../services/base.service';
import { HttpStatus } from '../../../utils/http-status';
import UsuarioRepository from '../repositories/UsuarioRepository';
import { AtualizarUsuarioInput } from '../schemas/usuario.schema';

class UsuarioService extends BaseService {
	private usuarioRepository = new UsuarioRepository();
	private adminAuthorization = new AdminAuthorization();

	async listar(usuarioLogadoId: number) {
		await this.adminAuthorization.isAdmin(usuarioLogadoId);
		return this.usuarioRepository.findAll();
	}

	async buscarPorId(usuarioLogadoId: number, usuarioId: number) {
		await this.adminAuthorization.isAdmin(usuarioLogadoId);
		const usuario = await this.usuarioRepository.findById(usuarioId);
		if (!usuario) {
			throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
		}
		return this.usuarioRepository.findPublicById(usuarioId);
	}

	async atualizar(usuarioLogadoId: number, usuarioId: number, data: AtualizarUsuarioInput) {
		await this.adminAuthorization.isAdmin(usuarioLogadoId);
		const usuario = await this.usuarioRepository.findById(usuarioId);
		if (!usuario) {
			throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
		}

		if (data.email || data.ra) {
			const conflito = await this.usuarioRepository.findByEmailOrRaExceptId(
				data.email ?? usuario.email,
				data.ra ?? usuario.ra,
				usuarioId,
			);
			if (conflito) {
				throw new AppError('USER_ALREADY_EXISTS', 'Email ou RA já registrados.', HttpStatus.CONFLICT);
			}
		}

		const updateData: Prisma.UsuarioUpdateInput = {};
		if (data.email !== undefined) updateData.email = data.email;
		if (data.ra !== undefined) updateData.ra = data.ra;
		if (data.nome !== undefined) updateData.nome = data.nome;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;
		if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
		if (data.password) {
			updateData.password = await bcrypt.hash(data.password, 10);
		}
		return this.usuarioRepository.update(usuarioId, updateData);
	}

	async excluir(usuarioLogadoId: number, usuarioId: number) {
		await this.adminAuthorization.isAdmin(usuarioLogadoId);
		if (usuarioLogadoId === usuarioId) {
			throw new AppError('CANNOT_DELETE_CURRENT_USER', 'Não é possível excluir o próprio usuário.', HttpStatus.BAD_REQUEST);
		}
		const usuario = await this.usuarioRepository.findById(usuarioId);
		if (!usuario) {
			throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado.', HttpStatus.NOT_FOUND);
		}
		await this.usuarioRepository.delete(usuarioId);
	}
}

export default UsuarioService;
