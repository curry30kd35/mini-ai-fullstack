-- AlterTable
ALTER TABLE `conversations` ADD COLUMN `template_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `prompt_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `system_prompt` TEXT NOT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `user_id` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prompt_templates_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `prompt_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prompt_templates` ADD CONSTRAINT `prompt_templates_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
