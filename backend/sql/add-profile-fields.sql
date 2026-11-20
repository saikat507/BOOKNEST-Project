ALTER TABLE `Users`
  ADD COLUMN `address` VARCHAR(300) NULL AFTER `facebook_url`,
  ADD COLUMN `profession` VARCHAR(100) NULL AFTER `address`,
  ADD COLUMN `institute` VARCHAR(150) NULL AFTER `profession`;
