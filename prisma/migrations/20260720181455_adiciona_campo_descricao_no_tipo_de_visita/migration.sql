/*
  Warnings:

  - Added the required column `descricao` to the `tipo_visitas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tipo_visitas` ADD COLUMN `descricao` VARCHAR(200) NOT NULL;
