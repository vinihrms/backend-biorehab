import type { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';

export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  protected constructor() {
    this.prisma = prisma;
  }
}
