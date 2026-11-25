-- AlterTable
ALTER TABLE `estudos` ADD COLUMN `cegamento_quebrado_em` DATETIME(3) NULL,
    ADD COLUMN `cegamento_quebrado_por_id` INTEGER NULL,
    ADD COLUMN `estudo_cego` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `participantes` MODIFY `telefone` VARCHAR(20) NULL,
    MODIFY `nome` VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE `permissoes_estudo` MODIFY `papel` ENUM('owner', 'study_admin', 'collector', 'interventionist', 'viewer') NOT NULL DEFAULT 'viewer';

-- AlterTable
ALTER TABLE `tipo_visitas` ADD COLUMN `catalogo_tipo_visita_id` INTEGER NULL,
    ADD COLUMN `ordem` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `can_create_study` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `variaveis` ADD COLUMN `allow_multiple` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `casas_decimais` INTEGER NULL DEFAULT 2,
    ADD COLUMN `catalogo_variavel_id` INTEGER NULL,
    ADD COLUMN `formula` TEXT NULL,
    ADD COLUMN `ordem` INTEGER NOT NULL DEFAULT 0,
    MODIFY `data_type` ENUM('numeric', 'integer', 'boolean', 'text', 'choice', 'calculated') NOT NULL DEFAULT 'numeric';

-- CreateTable
CREATE TABLE `grupos_estudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudo_id` INTEGER NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao_metodo` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alocacoes_grupo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participacao_estudo_id` INTEGER NOT NULL,
    `grupo_estudo_id` INTEGER NOT NULL,
    `alocado_por_id` INTEGER NOT NULL,
    `alocado_por_nome` VARCHAR(150) NOT NULL,
    `observacoes` TEXT NULL,
    `quebrado_em` DATETIME(3) NULL,
    `quebrado_por_id` INTEGER NULL,
    `quebrado_por_nome` VARCHAR(150) NULL,
    `motivo_quebra` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alocacoes_grupo_participacao_estudo_id_key`(`participacao_estudo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_intervencao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participacao_estudo_id` INTEGER NOT NULL,
    `grupo_estudo_id` INTEGER NOT NULL,
    `data` DATE NOT NULL,
    `realizado_por` VARCHAR(150) NOT NULL,
    `notas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogo_variaveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `unidade` VARCHAR(20) NULL,
    `data_type` ENUM('numeric', 'integer', 'boolean', 'text', 'choice', 'calculated') NOT NULL DEFAULT 'numeric',
    `allow_multiple` BOOLEAN NOT NULL DEFAULT false,
    `options` TEXT NULL,
    `descricao` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `catalogo_variaveis_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogo_tipos_visita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `catalogo_tipos_visita_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formularios_recrutamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudo_id` INTEGER NOT NULL,
    `token_publico` VARCHAR(64) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `campos_triagem` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `formularios_recrutamento_estudo_id_key`(`estudo_id`),
    UNIQUE INDEX `formularios_recrutamento_token_publico_key`(`token_publico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidatos_estudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudo_id` INTEGER NOT NULL,
    `formulario_id` INTEGER NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `email` VARCHAR(254) NULL,
    `sexo` ENUM('MASCULINO', 'FEMININO', 'OUTRO') NOT NULL,
    `nascimento` DATE NOT NULL,
    `respostas_triagem` JSON NULL,
    `status` ENUM('PENDENTE', 'CONTATADO', 'APROVADO', 'RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    `notas_contato` TEXT NULL,
    `participante_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importacoes_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estudo_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `usuario_nome` VARCHAR(150) NOT NULL,
    `nome_arquivo` VARCHAR(255) NOT NULL,
    `layout` VARCHAR(10) NOT NULL,
    `participantes_criados` INTEGER NOT NULL DEFAULT 0,
    `visitas_criadas` INTEGER NOT NULL DEFAULT 0,
    `medicoes_criadas` INTEGER NOT NULL DEFAULT 0,
    `linhas_ignoradas` INTEGER NOT NULL DEFAULT 0,
    `resumo` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tipo_visitas` ADD CONSTRAINT `tipo_visitas_catalogo_tipo_visita_id_fkey` FOREIGN KEY (`catalogo_tipo_visita_id`) REFERENCES `catalogo_tipos_visita`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variaveis` ADD CONSTRAINT `variaveis_catalogo_variavel_id_fkey` FOREIGN KEY (`catalogo_variavel_id`) REFERENCES `catalogo_variaveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos_estudo` ADD CONSTRAINT `grupos_estudo_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alocacoes_grupo` ADD CONSTRAINT `alocacoes_grupo_participacao_estudo_id_fkey` FOREIGN KEY (`participacao_estudo_id`) REFERENCES `participacoes_estudo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alocacoes_grupo` ADD CONSTRAINT `alocacoes_grupo_grupo_estudo_id_fkey` FOREIGN KEY (`grupo_estudo_id`) REFERENCES `grupos_estudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_intervencao` ADD CONSTRAINT `registros_intervencao_participacao_estudo_id_fkey` FOREIGN KEY (`participacao_estudo_id`) REFERENCES `participacoes_estudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_intervencao` ADD CONSTRAINT `registros_intervencao_grupo_estudo_id_fkey` FOREIGN KEY (`grupo_estudo_id`) REFERENCES `grupos_estudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formularios_recrutamento` ADD CONSTRAINT `formularios_recrutamento_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidatos_estudo` ADD CONSTRAINT `candidatos_estudo_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidatos_estudo` ADD CONSTRAINT `candidatos_estudo_formulario_id_fkey` FOREIGN KEY (`formulario_id`) REFERENCES `formularios_recrutamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importacoes_log` ADD CONSTRAINT `importacoes_log_estudo_id_fkey` FOREIGN KEY (`estudo_id`) REFERENCES `estudos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
