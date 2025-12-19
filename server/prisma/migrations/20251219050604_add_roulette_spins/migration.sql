-- CreateTable
CREATE TABLE `roulette_spins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `prize` VARCHAR(50) NOT NULL,
    `prize_minutes` INTEGER NULL,
    `spun_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `roulette_spins_user_id_spun_at_idx`(`user_id`, `spun_at`),
    INDEX `roulette_spins_spun_at_idx`(`spun_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roulette_spins` ADD CONSTRAINT `roulette_spins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
