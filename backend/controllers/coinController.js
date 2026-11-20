const { User, CoinLedger } = require('../models');
const { awardCoins } = require('../utils/coinService');
require('dotenv').config();

/**
 * Get current user's coin balance
 * @route GET /api/coins/balance
 */
const getBalance = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      coin_balance: user.coin_balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's coin ledger with pagination
 * @route GET /api/coins/ledger
 */
const getLedger = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch ledger entries
    const { count, rows } = await CoinLedger.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }
    });

    const totalPages = Math.ceil(count / limit);

    // Compute stats for all time
    const allEntries = await CoinLedger.findAll({
      where: { user_id: req.user.id },
      attributes: ['amount', 'type', 'reason']
    });

    let earned = 0;
    let spent = 0;
    let donated = 0;
    let exchanges = 0;

    for (const entry of allEntries) {
      if (entry.type === 'credit') {
        earned += entry.amount;
      } else if (entry.type === 'debit') {
        spent += entry.amount;
      }
      if (entry.reason === 'donate_reward') {
        donated += entry.amount;
      }
      if (entry.reason === 'exchange_reward') {
        exchanges += 1;
      }
    }

    return res.status(200).json({
      success: true,
      transactions: rows,
      total: count,
      page: parseInt(page),
      totalPages,
      limit: parseInt(limit),
      stats: { earned, spent, donated, exchanges }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Award coins to a user
 * @route POST /api/coins/admin/award
 * @auth Admin only
 */
const adminAwardCoins = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;

    // Validation
    if (!userId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID, amount, and reason are required'
      });
    }

    // Validate amount is positive number
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Award coins
    try {
      const newBalance = await awardCoins(userId, amount, reason);

      return res.status(200).json({
        success: true,
        message: 'Coins awarded successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          coin_balance: newBalance
        }
      });
    } catch (coinError) {
      return res.status(400).json({
        success: false,
        message: coinError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalance,
  getLedger,
  adminAwardCoins
};
