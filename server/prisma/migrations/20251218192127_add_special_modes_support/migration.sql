/*
  Warnings:

  - You are about to drop the column `wordList` on the `game_modes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `game_modes` DROP COLUMN `wordList`,
    ADD COLUMN `button_color` VARCHAR(7) NULL,
    ADD COLUMN `button_gradient` JSON NULL,
    ADD COLUMN `button_image` VARCHAR(500) NULL,
    ADD COLUMN `items` JSON NULL,
    ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'word',
    ADD COLUMN `word_list` TEXT NULL;

-- CreateTable
CREATE TABLE `mode_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(50) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `mode_images_filename_key`(`filename`),
    INDEX `mode_images_filename_idx`(`filename`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `game_modes_type_idx` ON `game_modes`(`type`);
