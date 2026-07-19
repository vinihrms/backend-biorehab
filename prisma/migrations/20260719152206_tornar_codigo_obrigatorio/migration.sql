/*
  Warnings:

  - Made the column `codigo` on table `participacoes_estudo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `participacoes_estudo` MODIFY `codigo` VARCHAR(20) NOT NULL;
