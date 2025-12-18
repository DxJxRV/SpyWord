-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_is_admin_idx` ON `users`(`is_admin`);
