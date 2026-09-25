ALTER TABLE `visitas` ADD COLUMN `created_by_name` VARCHAR(150) NULL;
UPDATE `visitas` v INNER JOIN `usuarios` u ON u.`id` = v.`created_by`
SET v.`created_by_name` = u.`nome`;
ALTER TABLE `visitas` DROP FOREIGN KEY `visitas_created_by_fkey`;
DROP INDEX `visitas_created_by_fkey` ON `visitas`;
ALTER TABLE `visitas` DROP COLUMN `created_by`;
ALTER TABLE `visitas` CHANGE `created_by_name` `created_by` VARCHAR(150) NOT NULL;

ALTER TABLE `medicoes` ADD COLUMN `created_by_name` VARCHAR(150) NULL;
UPDATE `medicoes` m INNER JOIN `usuarios` u ON u.`id` = m.`created_by`
SET m.`created_by_name` = u.`nome`;
ALTER TABLE `medicoes` DROP FOREIGN KEY `medicoes_created_by_fkey`;
DROP INDEX `medicoes_created_by_fkey` ON `medicoes`;
ALTER TABLE `medicoes` DROP COLUMN `created_by`;
ALTER TABLE `medicoes` CHANGE `created_by_name` `created_by` VARCHAR(150) NOT NULL;