/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `participacoes_estudo` table. All the data in the column will be lost.
  - You are about to drop the column `estudo_id` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `participante_id` on the `visitas` table. All the data in the column will be lost.
  - Made the column `sigla` on table `estudos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `codigo` on table `participacoes_estudo` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `participacao_estudo_id` to the `visitas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `participacoes_estudo` DROP FOREIGN KEY `participacoes_estudo_participante_id_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_estudo_id_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_participante_id_fkey`;

-- DropForeignKey
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_tipo_visita_id_fkey`;

-- DropIndex
DROP INDEX `participacoes_estudo_participante_id_fkey` ON `participacoes_estudo`;

-- DropIndex
DROP INDEX `visitas_estudo_id_fkey` ON `visitas`;

-- DropIndex
DROP INDEX `visitas_participante_id_fkey` ON `visitas`;

-- DropIndex
DROP INDEX `visitas_tipo_visita_id_fkey` ON `visitas`;

-- AlterTable
ALTER TABLE `estudos` MODIFY `sigla` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `participacoes_estudo` DROP COLUMN `deleted_at`,
    MODIFY `codigo` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `visitas` DROP COLUMN `estudo_id`,
    DROP COLUMN `participante_id`,
    ADD COLUMN `estudoId` INTEGER NULL,
    ADD COLUMN `participacao_estudo_id` INTEGER NOT NULL,
    ADD COLUMN `participanteId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_participacao_estudo_id_fkey` FOREIGN KEY (`participacao_estudo_id`) REFERENCES `participacoes_estudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_tipo_visita_id_fkey` FOREIGN KEY (`tipo_visita_id`) REFERENCES `tipo_visitas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_estudoId_fkey` FOREIGN KEY (`estudoId`) REFERENCES `estudos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_participanteId_fkey` FOREIGN KEY (`participanteId`) REFERENCES `participantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participacoes_estudo` ADD CONSTRAINT `participacoes_estudo_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
