-- Run once after deploying the code changes in this branch.
-- The application uses `bookreturns` as the canonical return table.
-- This assumes the duplicate `book_returns` table exists, as seen in the DB schema.

CREATE TABLE IF NOT EXISTS `bookreturns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `due_date` DATE NOT NULL,
  `actual_return_date` DATE NULL,
  `fine_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('borrowed', 'returned', 'late') NOT NULL DEFAULT 'borrowed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_return_transaction_cleanup` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE CASCADE
);

INSERT INTO `bookreturns`
SELECT *
FROM `book_returns`
WHERE NOT EXISTS (
  SELECT 1
  FROM `bookreturns` existing
  WHERE existing.`id` = `book_returns`.`id`
);

DROP TABLE IF EXISTS `book_returns`;
DROP TABLE IF EXISTS `chats`;
