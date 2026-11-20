ALTER TABLE `Users`
  ADD COLUMN `password_reset_token_hash` CHAR(64) NULL AFTER `otp_expires_at`;
