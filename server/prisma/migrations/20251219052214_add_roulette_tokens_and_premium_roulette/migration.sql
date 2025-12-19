/*
  Warnings:

  - Added the required column `roulette_type` to the `roulette_spins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `roulette_spins` ADD COLUMN `roulette_type` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `daily_roulette_tokens` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `last_daily_token_reset` DATETIME(3) NULL,
    ADD COLUMN `premium_roulette_tokens` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `roulette_spins_roulette_type_idx` ON `roulette_spins`(`roulette_type`);
