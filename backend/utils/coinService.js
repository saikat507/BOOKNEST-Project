const { User, CoinLedger } = require('../models');
const sequelize = require('../config/database');

/**
 * Award coins to a user
 * @param {number} userId - User ID
 * @param {number} amount - Amount of coins to award
 * @param {string} reason - Reason for the credit (e.g., 'donate_reward')
 * @param {number} referenceId - Optional reference ID (book_id, transaction_id, etc.)
 * @returns {Promise<number>} Updated coin balance
 */
const awardCoins = async (userId, amount, reason, referenceId = null) => {
  const transaction = await sequelize.transaction();

  try {
    // Find user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Update coin balance
    const newBalance = user.coin_balance + amount;
    await user.update({ coin_balance: newBalance }, { transaction });

    // Create ledger entry
    await CoinLedger.create(
      {
        user_id: userId,
        amount: amount,
        type: 'credit',
        reason: reason,
        reference_id: referenceId
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    return newBalance;
  } catch (error) {
    // Rollback on error
    await transaction.rollback();
    throw new Error(`Failed to award coins: ${error.message}`);
  }
};

/**
 * Deduct coins from a user
 * @param {number} userId - User ID
 * @param {number} amount - Amount of coins to deduct
 * @param {string} reason - Reason for the debit (e.g., 'purchase')
 * @param {number} referenceId - Optional reference ID (book_id, transaction_id, etc.)
 * @returns {Promise<number>} Updated coin balance
 */
const deductCoins = async (userId, amount, reason, referenceId = null) => {
  const transaction = await sequelize.transaction();

  try {
    // Find user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Check if user has enough coins
    if (user.coin_balance < amount) {
      throw new Error(`Insufficient coins. Available: ${user.coin_balance}, Required: ${amount}`);
    }

    // Update coin balance
    const newBalance = user.coin_balance - amount;
    await user.update({ coin_balance: newBalance }, { transaction });

    // Create ledger entry
    await CoinLedger.create(
      {
        user_id: userId,
        amount: amount,
        type: 'debit',
        reason: reason,
        reference_id: referenceId
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    return newBalance;
  } catch (error) {
    // Rollback on error
    await transaction.rollback();
    throw new Error(`Failed to deduct coins: ${error.message}`);
  }
};

/**
 * Get current coin balance of a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Current coin balance
 */
const getBalance = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user.coin_balance;
  } catch (error) {
    throw new Error(`Failed to get balance: ${error.message}`);
  }
};

/**
 * Transfer coins from one user to another
 * @param {number} fromUserId - Sender user ID
 * @param {number} toUserId - Receiver user ID
 * @param {number} amount - Amount of coins to transfer
 * @param {string} reason - Reason for the transfer
 * @returns {Promise<object>} { senderBalance, receiverBalance }
 */
const transferCoins = async (fromUserId, toUserId, amount, reason) => {
  const transaction = await sequelize.transaction();

  try {
    // Find both users
    const sender = await User.findByPk(fromUserId, { transaction });
    const receiver = await User.findByPk(toUserId, { transaction });

    if (!sender) {
      throw new Error(`Sender user with ID ${fromUserId} not found`);
    }
    if (!receiver) {
      throw new Error(`Receiver user with ID ${toUserId} not found`);
    }

    // Check if sender has enough coins
    if (sender.coin_balance < amount) {
      throw new Error(`Insufficient coins. Sender available: ${sender.coin_balance}, Required: ${amount}`);
    }

    // Deduct from sender
    const senderNewBalance = sender.coin_balance - amount;
    await sender.update({ coin_balance: senderNewBalance }, { transaction });

    // Award to receiver
    const receiverNewBalance = receiver.coin_balance + amount;
    await receiver.update({ coin_balance: receiverNewBalance }, { transaction });

    // Create ledger entries for both
    await CoinLedger.create(
      {
        user_id: fromUserId,
        amount: amount,
        type: 'debit',
        reason: reason,
        reference_id: toUserId
      },
      { transaction }
    );

    await CoinLedger.create(
      {
        user_id: toUserId,
        amount: amount,
        type: 'credit',
        reason: reason,
        reference_id: fromUserId
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    return {
      senderBalance: senderNewBalance,
      receiverBalance: receiverNewBalance
    };
  } catch (error) {
    // Rollback on error
    await transaction.rollback();
    throw new Error(`Failed to transfer coins: ${error.message}`);
  }
};

module.exports = {
  awardCoins,
  deductCoins,
  getBalance,
  transferCoins
};
