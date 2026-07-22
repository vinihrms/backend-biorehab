/*
  Warnings:

  - A unique constraint covering the columns `[participacao_estudo_id,tipo_visita_id]` on the table `visitas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `visitas_participacao_estudo_id_tipo_visita_id_key` ON `visitas`(`participacao_estudo_id`, `tipo_visita_id`);
