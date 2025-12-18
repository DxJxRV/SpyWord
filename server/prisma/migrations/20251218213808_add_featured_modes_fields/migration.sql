-- AlterTable
ALTER TABLE `game_modes` ADD COLUMN `featured_order` INTEGER NULL,
    ADD COLUMN `is_featured_on_home` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `game_modes_is_featured_on_home_featured_order_idx` ON `game_modes`(`is_featured_on_home`, `featured_order`);
