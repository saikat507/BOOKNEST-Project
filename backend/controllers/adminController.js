const {
  User,
  Book,
  BookRequest,
  Transaction,
  CoinLedger,
  Notification,
  UserVerification,
  Report,
  AdminSetting,
  BanHistory
} = require('../models');
const { awardCoins, deductCoins } = require('../utils/coinService');
const { defaults: numericSettingDefaults } = require('../utils/settingsService');
const { Op, fn, col, literal } = require('sequelize');
const { attachVerificationState } = require('../utils/verificationService');

const serializeVerification = (verification) => {
  const item = verification.toJSON ? verification.toJSON() : verification;
  return {
    id: item.id,
    user_id: item.user_id,
    status: item.status,
    nid_front_image: item.nid_front_image,
    rejection_reason: item.rejection_reason,
    verified_by: item.verified_by,
    verified_at: item.verified_at,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    user: item.user,
    verified_by_user: item.verified_by_user
  };
};

const markOverdueAdoptions = async () => {
  const today = new Date().toISOString().slice(0, 10);
  await Transaction.update(
    { status: 'overdue' },
    {
      where: {
        transaction_type: 'adopt',
        status: 'ongoing',
        [Op.or]: [
          { due_date: { [Op.lt]: today } },
          { return_date: { [Op.lt]: today } }
        ],
        returned_at: null
      }
    }
  );
};

const getDashboardStats = async (req, res, next) => {
  try {
    await markOverdueAdoptions();

    const [
      totalUsers,
      totalBooks,
      totalTransactions,
      completedTransactions,
      pendingVerifications,
      approvedVerifications,
      rejectedVerifications,
      activeReports,
      booksByType,
      mostActiveUsers,
      mostActiveInstitutes,
      coinIssued,
      coinSpent,
      recentActivity,
      pendingVerificationRows
    ] = await Promise.all([
      User.count(),
      Book.count(),
      Transaction.count(),
      Transaction.count({ where: { status: 'completed' } }),
      UserVerification.count({ where: { status: 'pending' } }),
      UserVerification.count({ where: { status: 'approved' } }),
      UserVerification.count({ where: { status: 'rejected' } }),
      Report.count({ where: { status: 'pending' } }),
      Book.findAll({
        attributes: ['listing_type', [fn('COUNT', col('Book.id')), 'count']],
        group: ['listing_type'],
        raw: true
      }),
      Transaction.findAll({
        attributes: ['giver_id', [fn('COUNT', col('Transaction.id')), 'count']],
        include: [{ model: User, as: 'giver', attributes: ['id', 'name', 'email'] }],
        group: ['giver_id', 'giver.id'],
        order: [[literal('count'), 'DESC']],
        limit: 5
      }),
      User.findAll({
        attributes: ['institute', [fn('COUNT', col('id')), 'count']],
        where: { institute: { [Op.ne]: null } },
        group: ['institute'],
        order: [[literal('count'), 'DESC']],
        limit: 5,
        raw: true
      }),
      CoinLedger.sum('amount', { where: { type: { [Op.in]: ['credit', 'earn', 'admin_adjustment'] } } }),
      CoinLedger.sum('amount', { where: { type: { [Op.in]: ['debit', 'spend'] } } }),
      Transaction.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'giver', attributes: ['id', 'name', 'profile_image_url'] },
          { model: User, as: 'receiver', attributes: ['id', 'name', 'profile_image_url'] },
          { model: Book, as: 'book', attributes: ['id', 'title', 'author'] }
        ]
      }),
      UserVerification.findAll({
        where: { status: 'pending' },
        include: {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'profile_image_url', 'address', 'profession', 'institute', 'facebook_url']
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ]);

    const pendingVerificationUsers = pendingVerificationRows.map((verification) => ({
      id: verification.user.id,
      name: verification.user.name,
      email: verification.user.email,
      verification_id: verification.id,
      idDocument: verification.nid_front_image,
      verification_status: verification.status,
      user: verification.user
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBooks,
        totalTransactions,
        completedTransactions,
        pendingVerifications,
        pendingVerification: pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        activeReports,
        unverifiedUsers: Math.max(totalUsers - approvedVerifications, 0),
        booksByType,
        mostActiveUsers,
        mostActiveInstitutes,
        coinCirculation: {
          issued: coinIssued || 0,
          spent: coinSpent || 0
        },
        recentActivity
      },
      pendingVerifications: pendingVerificationUsers,
      recentTransactions: recentActivity
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, role, verification_status, status, institute } = req.query;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { institute: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) whereClause.role = role;
    if (institute) whereClause.institute = { [Op.like]: `%${institute}%` };
    if (status === 'active') whereClause.is_active = true;
    if (status === 'blocked') whereClause.is_active = false;
    if (status === 'banned') whereClause.ban_status = 'banned';

    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'email', 'phone', 'role', 'coin_balance', 'is_active',
        'ban_status', 'ban_reason', 'banned_at', 'profile_image_url', 'facebook_url',
        'address', 'profession', 'institute', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    let users = await attachVerificationState(rows);
    if (verification_status) {
      users = users.filter((user) => user.verification_status === verification_status);
    }

    return res.status(200).json({
      success: true,
      users,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password_hash', 'otp', 'otp_expires_at', 'password_reset_token_hash'] },
      include: [
        { model: CoinLedger, as: 'coinEntries', order: [['createdAt', 'DESC']] },
        { model: Book, as: 'books', order: [['createdAt', 'DESC']] },
        {
          model: Transaction,
          as: 'receivedTransactions',
          include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'author', 'cover_image_url'] }]
        },
        { model: BanHistory, as: 'banHistory', include: [{ model: User, as: 'admin', attributes: ['id', 'name', 'email'] }] },
        { model: UserVerification, as: 'verifications', order: [['createdAt', 'DESC']] }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: await attachVerificationState(user.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

const recordUserAction = async (user, adminId, action, reason = null) => {
  await BanHistory.create({ user_id: user.id, admin_id: adminId, action, reason });
};

const blockUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot block your own admin account' });

    const reason = req.body.reason || 'Blocked by admin';
    await user.update({ is_active: false, ban_status: 'blocked', ban_reason: reason });
    await recordUserAction(user, req.user.id, 'block', reason);
    return res.status(200).json({ success: true, message: 'User blocked successfully', user });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const reason = req.body.reason || 'Unblocked by admin';
    await user.update({ is_active: true, ban_status: 'none', ban_reason: null, banned_at: null });
    await recordUserAction(user, req.user.id, 'unblock', reason);
    return res.status(200).json({ success: true, message: 'User unblocked successfully', user });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'You cannot ban your own admin account' });

    const reason = (req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'Ban reason is required' });

    await user.update({ is_active: false, ban_status: 'banned', ban_reason: reason, banned_at: new Date() });
    await recordUserAction(user, req.user.id, 'ban', reason);
    await Notification.create({
      user_id: user.id,
      type: 'warning',
      title: 'Account Banned',
      message: `Your account has been banned. Reason: ${reason}`
    });

    return res.status(200).json({ success: true, message: 'User banned successfully', user });
  } catch (error) {
    next(error);
  }
};

const warnUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const reason = (req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'Warning reason is required' });

    await recordUserAction(user, req.user.id, 'warn', reason);
    await Notification.create({
      user_id: user.id,
      type: 'warning',
      title: 'Admin Warning',
      message: reason
    });

    return res.status(200).json({ success: true, message: 'Warning sent successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return user.is_active ? blockUser(req, res, next) : unblockUser(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getPendingVerifications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const verifications = await UserVerification.findAll({
      where: status === 'all' ? {} : { status },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'profile_image_url', 'address', 'facebook_url', 'profession', 'institute', 'createdAt']
        },
        { model: User, as: 'verified_by_user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, verifications: verifications.map(serializeVerification) });
  } catch (error) {
    next(error);
  }
};

const updateUserVerificationMirror = async (verification) => {
  await User.update(
    {
      verification_status: verification.status,
      rejection_reason: verification.rejection_reason
    },
    { where: { id: verification.user_id } }
  );
};

const approveVerification = async (req, res, next) => {
  try {
    const verification = await UserVerification.findByPk(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'Verification request not found' });

    await verification.update({
      status: 'approved',
      verified_by: req.user.id,
      verified_at: new Date(),
      rejection_reason: null
    });
    await updateUserVerificationMirror(verification);
    await Notification.create({
      user_id: verification.user_id,
      type: 'approved',
      title: 'Identity Verified',
      message: 'Your NID verification has been approved.'
    });

    return res.status(200).json({ success: true, message: 'Verification approved successfully', verification: serializeVerification(verification) });
  } catch (error) {
    next(error);
  }
};

const rejectVerification = async (req, res, next) => {
  try {
    const finalReason = (req.body.reason || req.body.rejection_reason || '').trim();
    if (!finalReason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const verification = await UserVerification.findByPk(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'Verification request not found' });

    await verification.update({
      status: 'rejected',
      rejection_reason: finalReason,
      verified_by: req.user.id,
      verified_at: new Date()
    });
    await updateUserVerificationMirror(verification);
    await Notification.create({
      user_id: verification.user_id,
      type: 'rejected',
      title: 'Verification Rejected',
      message: `Your NID verification was rejected. Reason: ${finalReason}`
    });

    return res.status(200).json({ success: true, message: 'Verification rejected successfully', verification: serializeVerification(verification) });
  } catch (error) {
    next(error);
  }
};

const requestVerificationReupload = async (req, res, next) => {
  try {
    const reason = (req.body.reason || 'Please upload a clearer NID image.').trim();
    const verification = await UserVerification.findByPk(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'Verification request not found' });

    await verification.update({
      status: 'rejected',
      rejection_reason: `Re-upload requested: ${reason}`,
      verified_by: req.user.id,
      verified_at: new Date()
    });
    await updateUserVerificationMirror(verification);
    await Notification.create({
      user_id: verification.user_id,
      type: 'rejected',
      title: 'ID Re-upload Requested',
      message: reason
    });

    return res.status(200).json({ success: true, message: 'Re-upload requested successfully', verification: serializeVerification(verification) });
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  try {
    let verification = await UserVerification.findOne({
      where: { user_id: req.params.userId },
      order: [['createdAt', 'DESC']]
    });

    if (!verification) {
      return res.status(400).json({ success: false, message: 'No verification request found for this user' });
    }

    req.params.id = verification.id;
    return approveVerification(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getAllBooks = async (req, res, next) => {
  try {
    const { status, listing_type, search, page = 1, limit = 20 } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (listing_type) whereClause.listing_type = listing_type;
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Book.findAndCountAll({
      where: whereClause,
      include: { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'profile_image_url'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    return res.status(200).json({ success: true, books: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

const adminDeleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    const reason = req.body?.reason || 'Removed by admin';
    await book.update({ status: 'closed' });
    await Notification.create({
      user_id: book.user_id,
      type: 'warning',
      title: 'Listing Unpublished',
      message: `Your listing "${book.title}" was unpublished. Reason: ${reason}`
    });
    return res.status(200).json({ success: true, message: 'Book unpublished successfully', book });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    await markOverdueAdoptions();
    const { status, type, page = 1, limit = 20 } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.transaction_type = type;

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: Book, as: 'book', attributes: ['id', 'title', 'author', 'cover_image_url'] },
        { model: User, as: 'giver', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
        { model: Report, as: 'reports', attributes: ['id', 'status', 'reason'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    return res.status(200).json({ success: true, transactions: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    next(error);
  }
};

const adminAdjustCoins = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.body.user_id;
    const amount = parseInt(req.body.amount, 10);
    const reason = (req.body.reason || '').trim();

    if (!userId || !amount || !reason) {
      return res.status(400).json({ success: false, message: 'User ID, non-zero amount, and reason are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newBalance = user.coin_balance + amount;
    if (newBalance < 0) {
      return res.status(400).json({ success: false, message: 'Adjustment would make the balance negative' });
    }

    await user.update({ coin_balance: newBalance });
    await CoinLedger.create({
      user_id: userId,
      amount,
      type: 'admin_adjustment',
      reason: `admin: ${reason}`.slice(0, 255),
      reference_id: req.user.id
    });

    return res.status(200).json({ success: true, message: 'Coin balance adjusted successfully', user: { id: user.id, coin_balance: newBalance } });
  } catch (error) {
    next(error);
  }
};

const adminAwardCoins = adminAdjustCoins;

const getCoinTransactions = async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 50 } = req.query;
    const whereClause = userId ? { user_id: userId } : {};
    const { count, rows } = await CoinLedger.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });
    return res.status(200).json({ success: true, transactions: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    for (const [key, value] of Object.entries(numericSettingDefaults)) {
      await AdminSetting.findOrCreate({
        where: { key },
        defaults: { key, value: String(value), description: `Coin setting for ${key.replace(/_/g, ' ')}` }
      });
    }
    const settings = await AdminSetting.findAll({ order: [['key', 'ASC']] });
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const entries = req.body.settings || req.body;
    const saved = [];
    for (const [key, rawValue] of Object.entries(entries)) {
      if (!Object.hasOwn(numericSettingDefaults, key)) continue;
      const value = parseInt(rawValue, 10);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({ success: false, message: `${key} must be a non-negative number` });
      }
      const [setting] = await AdminSetting.findOrCreate({
        where: { key },
        defaults: { key, value: String(value), updated_by: req.user.id }
      });
      await setting.update({ value: String(value), updated_by: req.user.id });
      saved.push(setting);
    }
    return res.status(200).json({ success: true, message: 'Settings updated successfully', settings: saved });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const whereClause = status ? { status } : {};
    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reported_user', attributes: ['id', 'name', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] },
        { model: Transaction, as: 'transaction', attributes: ['id', 'transaction_type', 'status', 'coin_amount'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });
    return res.status(200).json({ success: true, reports: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { action, note, coin_refund_amount } = req.body;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (action === 'warn') await recordUserAction({ id: report.reported_user_id }, req.user.id, 'warn', note || report.reason);
    if (action === 'ban') {
      const reportedUser = await User.findByPk(report.reported_user_id);
      if (reportedUser && reportedUser.id !== req.user.id) {
        const reason = note || report.reason;
        await reportedUser.update({ is_active: false, ban_status: 'banned', ban_reason: reason, banned_at: new Date() });
        await recordUserAction(reportedUser, req.user.id, 'ban', reason);
      }
    }
    if (action === 'refund') {
      const amount = parseInt(coin_refund_amount, 10);
      if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Refund amount is required' });
      await awardCoins(report.reporter_id, amount, 'admin_adjustment', report.transaction_id || report.id);
    }

    await report.update({
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolution_note: note || action,
      resolved_by: req.user.id
    });

    return res.status(200).json({ success: true, message: 'Report resolved successfully', report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  banUser,
  warnUser,
  toggleBlockUser,
  verifyUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  requestVerificationReupload,
  getAllBooks,
  adminDeleteBook,
  getTransactions,
  adminAwardCoins,
  adminAdjustCoins,
  getCoinTransactions,
  getSettings,
  updateSettings,
  getReports,
  resolveReport
};
