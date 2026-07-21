/*
  Warnings:

  - You are about to drop the column `estudoId` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `participanteId` on the `visitas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_estudoId_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_participanteId_fkey`;

-- DropIndex
DROP INDEX `visitas_estudoId_fkey` ON `visitas`;

-- DropIndex
DROP INDEX `visitas_participanteId_fkey` ON `visitas`;

-- AlterTable
ALTER TABLE `participacoes_estudo` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `visitas` DROP COLUMN `estudoId`,
    DROP COLUMN `participanteId`;
