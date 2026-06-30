/*
  Warnings:

  - Made the column `sigla` on table `estudos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefone` on table `participantes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nascimento` on table `participantes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sexo` on table `participantes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `estudos` MODIFY `sigla` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `participantes` MODIFY `telefone` VARCHAR(20) NOT NULL,
    MODIFY `nascimento` DATE NOT NULL,
    MODIFY `sexo` ENUM('MASCULINO', 'FEMININO', 'OUTRO') NOT NULL;
