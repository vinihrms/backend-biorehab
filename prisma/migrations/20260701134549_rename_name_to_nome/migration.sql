/*
  Warnings:

  - You are about to drop the column `name` on the `participantes` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `usuarios` table. All the data in the column will be lost.
  - Added the required column `nome` to the `participantes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `participantes` DROP COLUMN `name`,
    ADD COLUMN `nome` VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `name`,
    ADD COLUMN `nome` VARCHAR(150) NOT NULL DEFAULT '';
