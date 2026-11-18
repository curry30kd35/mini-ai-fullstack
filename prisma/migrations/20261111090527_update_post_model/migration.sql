-- AlterTable
ALTER TABLE `posts` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tags` MODIFY `created_at` DATETIME(3) NULL;

-- RenameIndex
ALTER TABLE `_posttotag` RENAME INDEX `_PostToTag_AB_unique` TO `_posttotag_AB_unique`;

-- RenameIndex
ALTER TABLE `_posttotag` RENAME INDEX `_PostToTag_B_index` TO `_posttotag_B_index`;
