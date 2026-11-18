/*
  Warnings:

  - Made the column `created_at` on table `tags` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `tags` MODIFY `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);
