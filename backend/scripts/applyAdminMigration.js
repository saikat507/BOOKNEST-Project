const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbName = process.env.DB_NAME;

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
  multipleStatements: false
};

const columnExists = async (connection, tableName, columnName) => {
  const [rows] = await connection.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [dbName, tableName, columnName]
  );
  return rows.length > 0;
};

const constraintExists = async (connection, tableName, constraintName) => {
  const [rows] = await connection.execute(
    `SELECT 1
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
     LIMIT 1`,
    [dbName, tableName, constraintName]
  );
  return rows.length > 0;
};

const addColumnIfMissing = async (connection, tableName, columnName, definition) => {
  if (await columnExists(connection, tableName, columnName)) {
    console.log(`- ${tableName}.${columnName} already exists`);
    return;
  }

  await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`+ Added ${tableName}.${columnName}`);
};

const addConstraintIfMissing = async (connection, tableName, constraintName, sql) => {
  if (await constraintExists(connection, tableName, constraintName)) {
    console.log(`- ${constraintName} already exists`);
    return;
  }

  await connection.query(sql);
  console.log(`+ Added ${constraintName}`);
};

const normalizeTimestampColumns = async (connection, tableName) => {
  if (await columnExists(connection, tableName, 'created_at')) {
    await connection.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    console.log(`+ Normalized ${tableName}.created_at default`);
  }

  if (await columnExists(connection, tableName, 'updated_at')) {
    await connection.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    console.log(`+ Normalized ${tableName}.updated_at default`);
  }
};

const run = async () => {
  if (!dbName || !process.env.DB_USER) {
    throw new Error('DB_NAME and DB_USER must be set in backend/.env');
  }

  const connection = await mysql.createConnection(connectionConfig);

  try {
    await addColumnIfMissing(connection, 'Users', 'role', "ENUM('user', 'admin') NOT NULL DEFAULT 'user'");
    await addColumnIfMissing(connection, 'Users', 'verification_status', "ENUM('pending', 'approved', 'rejected') NULL");
    await addColumnIfMissing(connection, 'Users', 'rejection_reason', 'TEXT NULL');
    await addColumnIfMissing(connection, 'Users', 'ban_status', "ENUM('none', 'blocked', 'banned') NOT NULL DEFAULT 'none'");
    await addColumnIfMissing(connection, 'Users', 'ban_reason', 'TEXT NULL');
    await addColumnIfMissing(connection, 'Users', 'banned_at', 'DATETIME NULL');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`admin_settings\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        \`value\` VARCHAR(255) NOT NULL,
        \`description\` VARCHAR(255) NULL,
        \`updated_by\` INT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_admin_settings_updated_by\` (\`updated_by\`)
      )
    `);
    console.log('+ Ensured admin_settings table');
    await normalizeTimestampColumns(connection, 'admin_settings');

    await addConstraintIfMissing(
      connection,
      'admin_settings',
      'fk_admin_settings_updated_by',
      'ALTER TABLE `admin_settings` ADD CONSTRAINT `fk_admin_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `Users`(`id`) ON DELETE SET NULL'
    );

    await connection.query(`
      INSERT INTO \`admin_settings\` (\`key\`, \`value\`, \`description\`)
      VALUES
        ('signup_bonus', '50', 'Coins awarded when a user signs up'),
        ('donation_reward', '20', 'Coins awarded when a donation transaction completes'),
        ('adopt_reward', '5', 'Coins awarded to the lister when an adoption starts'),
        ('exchange_reward', '15', 'Coins awarded to each user when an exchange completes')
      ON DUPLICATE KEY UPDATE \`key\` = VALUES(\`key\`)
    `);
    console.log('+ Ensured default admin settings');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`ban_histories\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`admin_id\` INT NULL,
        \`action\` ENUM('block', 'unblock', 'ban', 'warn') NOT NULL,
        \`reason\` TEXT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_ban_histories_user_id\` (\`user_id\`),
        INDEX \`idx_ban_histories_admin_id\` (\`admin_id\`)
      )
    `);
    console.log('+ Ensured ban_histories table');
    await normalizeTimestampColumns(connection, 'ban_histories');

    await addConstraintIfMissing(
      connection,
      'ban_histories',
      'fk_ban_history_user',
      'ALTER TABLE `ban_histories` ADD CONSTRAINT `fk_ban_history_user` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE'
    );
    await addConstraintIfMissing(
      connection,
      'ban_histories',
      'fk_ban_history_admin',
      'ALTER TABLE `ban_histories` ADD CONSTRAINT `fk_ban_history_admin` FOREIGN KEY (`admin_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL'
    );

    await addColumnIfMissing(connection, 'Transactions', 'due_date', 'DATE NULL');
    await connection.query('UPDATE `Transactions` SET `due_date` = `return_date` WHERE `due_date` IS NULL AND `return_date` IS NOT NULL');
    console.log('+ Backfilled Transactions.due_date');

    await addColumnIfMissing(connection, 'Reports', 'transaction_id', 'INT NULL');
    await addColumnIfMissing(connection, 'Reports', 'resolution_note', 'TEXT NULL');
    await addColumnIfMissing(connection, 'Reports', 'resolved_by', 'INT NULL');
    await connection.query("ALTER TABLE `Reports` MODIFY COLUMN `status` ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending'");
    console.log('+ Updated Reports.status enum');

    await addConstraintIfMissing(
      connection,
      'Reports',
      'fk_reports_transaction',
      'ALTER TABLE `Reports` ADD CONSTRAINT `fk_reports_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE SET NULL'
    );
    await addConstraintIfMissing(
      connection,
      'Reports',
      'fk_reports_resolved_by',
      'ALTER TABLE `Reports` ADD CONSTRAINT `fk_reports_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `Users`(`id`) ON DELETE SET NULL'
    );

    await connection.query('ALTER TABLE `CoinLedgers` MODIFY COLUMN `reason` VARCHAR(255) NOT NULL');
    await connection.query("ALTER TABLE `CoinLedgers` MODIFY COLUMN `type` ENUM('credit', 'debit', 'earn', 'spend', 'admin_adjustment') NOT NULL");
    console.log('+ Updated CoinLedgers audit columns');

    console.log('Admin database migration completed.');
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
