/*
  Warnings:

  - A unique constraint covering the columns `[estudo_id,codigo]` on the table `participacoes_estudo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `estudos` ADD COLUMN `sigla` VARCHAR(10) NULL;

-- AlterTable
ALTER TABLE `participacoes_estudo` ADD COLUMN `codigo` VARCHAR(20) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `participacoes_estudo_estudo_id_codigo_key` ON `participacoes_estudo`(`estudo_id`, `codigo`);
