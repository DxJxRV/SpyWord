-- AlterTable
ALTER TABLE `users` ADD COLUMN `password` VARCHAR(255) NULL,
    ADD COLUMN `premium_expires_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`);
