-- CreateTable
CREATE TABLE `estudos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(254) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `ra` VARCHAR(6) NOT NULL,
    `name` VARCHAR(150) NOT NULL DEFAULT '',
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_ra_key`(`ra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `nascimento` DATE NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `estudo_id` INTEGER NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variaveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `unidade` VARCHAR(20) NULL,
    `data_type` ENUM('numeric', 'integer', 'boolean', 'text', 'choice') NOT NULL DEFAULT 'numeric',
    `options` TEXT NULL,
    `estudo_id` INTEGER NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `estudo_id` INTEGER NOT NULL,
    `tipo_visita_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participacoes_estudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudo_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `participacoes_estudo_estudo_id_participante_id_key`(`estudo_id`, `participante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissoes_estudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `papel` ENUM('owner', 'collector', 'viewer') NOT NULL DEFAULT 'viewer',
    `estudo_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `permissoes_estudo_estudo_id_usuario_id_key`(`estudo_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variavel_id` INTEGER NOT NULL,
    `visita_id` INTEGER NOT NULL,
    `valor_num` DECIMAL(10, 4) NULL,
    `valor_text` TEXT NULL,
    `lado` VARCHAR(1) NULL,
    `created_by` INTEGER NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tipo_visitas` ADD CONSTRAINT `tipo_visitas_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variaveis` ADD CONSTRAINT `variaveis_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_tipo_visita_id_fkey` FOREIGN KEY (`tipo_visita_id`) REFERENCES `tipo_visitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participacoes_estudo` ADD CONSTRAINT `participacoes_estudo_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participacoes_estudo` ADD CONSTRAINT `participacoes_estudo_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_estudo` ADD CONSTRAINT `permissoes_estudo_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_estudo` ADD CONSTRAINT `permissoes_estudo_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicoes` ADD CONSTRAINT `medicoes_variavel_id_fkey` FOREIGN KEY (`variavel_id`) REFERENCES `variaveis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicoes` ADD CONSTRAINT `medicoes_visita_id_fkey` FOREIGN KEY (`visita_id`) REFERENCES `visitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicoes` ADD CONSTRAINT `medicoes_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
