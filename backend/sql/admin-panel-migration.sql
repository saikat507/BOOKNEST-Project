-- Admin panel migration for BookNest.
-- Run this against the existing MySQL database before starting the app.

ALTER TABLE `Users`
  ADD COLUMN IF NOT EXISTS `verification_status` ENUM('pending', 'approved', 'rejected') NULL,
  ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `ban_status` ENUM('none', 'blocked', 'banned') NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS `ban_reason` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `banned_at` DATETIME NULL;

CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_by` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admin_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `Users`(`id`) ON DELETE SET NULL
);

INSERT INTO `admin_settings` (`key`, `value`, `description`)
VALUES
  ('signup_bonus', '50', 'Coins awarded when a user signs up'),
  ('donation_reward', '20', 'Coins awarded when a donation transaction completes'),
  ('adopt_reward', '5', 'Coins awarded to the lister when an adoption starts'),
  ('exchange_reward', '15', 'Coins awarded to each user when an exchange completes')
ON DUPLICATE KEY UPDATE `key` = VALUES(`key`);

CREATE TABLE IF NOT EXISTS `ban_histories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `admin_id` INT NULL,
  `action` ENUM('block', 'unblock', 'ban', 'warn') NOT NULL,
  `reason` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ban_history_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ban_history_admin` FOREIGN KEY (`admin_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL
);

ALTER TABLE `Transactions`
  ADD COLUMN IF NOT EXISTS `due_date` DATE NULL;

UPDATE `Transactions`
SET `due_date` = `return_date`
WHERE `due_date` IS NULL AND `return_date` IS NOT NULL;

ALTER TABLE `Reports`
  ADD COLUMN IF NOT EXISTS `transaction_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `resolution_note` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `resolved_by` INT NULL;

ALTER TABLE `Reports`
  MODIFY COLUMN `status` ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending';

ALTER TABLE `CoinLedgers`
  MODIFY COLUMN `reason` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `type` ENUM('credit', 'debit', 'earn', 'spend', 'admin_adjustment') NOT NULL;

-- Add these foreign keys manually if your MySQL version does not support IF NOT EXISTS on ALTER TABLE:
-- ALTER TABLE `Reports` ADD CONSTRAINT `fk_reports_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE SET NULL;
-- ALTER TABLE `Reports` ADD CONSTRAINT `fk_reports_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `Users`(`id`) ON DELETE SET NULL;
