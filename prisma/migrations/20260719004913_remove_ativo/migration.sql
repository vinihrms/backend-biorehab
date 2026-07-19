/*
  Warnings:

  - You are about to drop the column `ativo` on the `estudos` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `medicoes` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `participacoes_estudo` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `participantes` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `tipo_visitas` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `variaveis` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `visitas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `estudos` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `medicoes` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `participacoes_estudo` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `participantes` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `tipo_visitas` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `variaveis` DROP COLUMN `ativo`;

-- AlterTable
ALTER TABLE `visitas` DROP COLUMN `ativo`;
