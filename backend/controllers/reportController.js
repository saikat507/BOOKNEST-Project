const { Report, User, Book, Transaction } = require('../models');
const { Op } = require('sequelize');

const allowedStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];

/**
 * Create a new report
 * @route POST /api/reports
 */
const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const { reported_user_id, book_id, transaction_id, reason, description } = req.body;

    if (!reported_user_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'reported_user_id and reason are required'
      });
    }

    if (reported_user_id === reporterId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    const reportedUser = await User.findByPk(reported_user_id);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    let book = null;
    if (book_id) {
      book = await Book.findByPk(book_id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }
    }

    let transaction = null;
    if (transaction_id) {
      transaction = await Transaction.findByPk(transaction_id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
    }

    const report = await Report.create({
      reporter_id: reporterId,
      reported_user_id,
      book_id: book ? book_id : null,
      transaction_id: transaction ? transaction_id : null,
      reason,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports for the current user or admin
 * @route GET /api/reports
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter'
        });
      }
      whereClause.status = status;
    }

    if (req.user.role !== 'admin') {
      whereClause.reporter_id = req.user.id;
    }

    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reported_user', attributes: ['id', 'name', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] },
        { model: Transaction, as: 'transaction', attributes: ['id', 'transaction_type', 'status', 'coin_amount'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      reports: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single report
 * @route GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reported_user', attributes: ['id', 'name', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] },
        { model: Transaction, as: 'transaction', attributes: ['id', 'transaction_type', 'status', 'coin_amount'] }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (req.user.role !== 'admin' && report.reporter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report'
      });
    }

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update report status (admin only)
 * @route PATCH /api/reports/:id/status
 */
const updateReportStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update report status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus
};
