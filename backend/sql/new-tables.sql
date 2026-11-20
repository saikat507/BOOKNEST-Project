-- New BookNest tables for Wishlist, Report, BookReturn, UserVerification

CREATE TABLE IF NOT EXISTS `Wishlists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `ux_wishlist_user_book` (`user_id`, `book_id`),
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_book` FOREIGN KEY (`book_id`) REFERENCES `Books`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reporter_id` INT NOT NULL,
  `reported_user_id` INT NOT NULL,
  `book_id` INT NULL,
  `reason` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_reported_user` FOREIGN KEY (`reported_user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_book` FOREIGN KEY (`book_id`) REFERENCES `Books`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `bookreturns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `due_date` DATE NOT NULL,
  `actual_return_date` DATE NULL,
  `fine_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('borrowed', 'returned', 'late') NOT NULL DEFAULT 'borrowed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_return_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `userverifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `nid_front_image` VARCHAR(500) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `verified_by` INT NULL,
  `verified_at` DATETIME NULL,
  `rejection_reason` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_verification_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_verification_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `Users`(`id`) ON DELETE SET NULL
);
