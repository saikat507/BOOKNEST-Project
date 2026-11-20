const { BookReturn, Transaction, Book, User } = require('../models');
const { deductCoins } = require('../utils/coinService');
const { Op } = require('sequelize');

const FINE_PER_LATE_DAY = 2;

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const calculateLateDays = (actualDate, dueDate) => {
  const diff = parseDateOnly(actualDate) - parseDateOnly(dueDate);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const addReturnMeta = (returnRecord) => {
  const plain = typeof returnRecord.toJSON === 'function' ? returnRecord.toJSON() : returnRecord;
  const today = formatDateOnly(new Date());
  const dueDate = plain.due_date;
  const comparisonDate = plain.actual_return_date || today;
  const lateDays = dueDate ? calculateLateDays(comparisonDate, dueDate) : 0;
  const remainingMs = dueDate ? parseDateOnly(dueDate) - parseDateOnly(today) : 0;
  const daysRemaining = dueDate ? Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24))) : null;

  return {
    ...plain,
    daysRemaining,
    lateDays: plain.status === 'late' ? lateDays : 0
  };
};

const refreshLateStatuses = async (records) => {
  const list = Array.isArray(records) ? records : [records];
  const today = formatDateOnly(new Date());

  await Promise.all(
    list
      .filter((record) => record && record.status === 'borrowed' && record.due_date < today)
      .map(async (record) => {
        record.status = 'late';
        await record.save();
      })
  );
};

const returnIncludes = [
  {
    model: Transaction,
    as: 'transaction',
    include: [
      { model: Book, as: 'book', attributes: ['id', 'title', 'author', 'cover_image_url', 'createdAt'] },
      { model: User, as: 'giver', attributes: ['id', 'name', 'email', 'profile_image_url'] },
      { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'profile_image_url'] }
    ]
  }
];

const ensureCanView = (req, transaction) => {
  return req.user.role === 'admin' || transaction.giver_id === req.user.id || transaction.receiver_id === req.user.id;
};

const createBookReturn = async (req, res, next) => {
  try {
    const { transaction_id, due_date } = req.body;

    if (!transaction_id || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'transaction_id and due_date are required'
      });
    }

    const transaction = await Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.transaction_type !== 'adopt') {
      return res.status(400).json({
        success: false,
        message: 'Return records can only be created for adoption transactions'
      });
    }

    if (!ensureCanView(req, transaction)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create this return record'
      });
    }

    const [bookReturn, created] = await BookReturn.findOrCreate({
      where: { transaction_id },
      defaults: {
        transaction_id,
        due_date,
        actual_return_date: null,
        fine_amount: 0,
        status: 'borrowed'
      }
    });

    if (!created) {
      return res.status(409).json({
        success: false,
        message: 'Return record already exists for this transaction'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Return record created successfully',
      returnRecord: bookReturn
    });
  } catch (error) {
    next(error);
  }
};

const getBookReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (req.user.role !== 'admin') {
      whereClause[Op.or] = [
        { '$transaction.giver_id$': userId },
        { '$transaction.receiver_id$': userId }
      ];
    }

    const { count, rows } = await BookReturn.findAndCountAll({
      where: whereClause,
      include: returnIncludes,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });

    await refreshLateStatuses(rows);

    return res.status(200).json({
      success: true,
      returns: rows.map(addReturnMeta),
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookReturns = async (req, res, next) => {
  try {
    const rows = await BookReturn.findAll({
      include: returnIncludes,
      where: { '$transaction.receiver_id$': req.user.id },
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    await refreshLateStatuses(rows);

    return res.status(200).json({
      success: true,
      returns: rows.map(addReturnMeta)
    });
  } catch (error) {
    next(error);
  }
};

const getOwnerPendingReturns = async (req, res, next) => {
  try {
    const rows = await BookReturn.findAll({
      include: returnIncludes,
      where: {
        status: { [Op.in]: ['borrowed', 'late'] },
        '$transaction.giver_id$': req.user.id
      },
      order: [['due_date', 'ASC']],
      subQuery: false
    });

    await refreshLateStatuses(rows);

    return res.status(200).json({
      success: true,
      returns: rows.map(addReturnMeta)
    });
  } catch (error) {
    next(error);
  }
};

const getOverdueReturns = async (req, res, next) => {
  try {
    const today = formatDateOnly(new Date());
    const whereClause = {
      status: { [Op.in]: ['borrowed', 'late'] },
      due_date: { [Op.lt]: today }
    };

    if (req.user.role !== 'admin') {
      whereClause[Op.or] = [
        { '$transaction.giver_id$': req.user.id },
        { '$transaction.receiver_id$': req.user.id }
      ];
    }

    const rows = await BookReturn.findAll({
      include: returnIncludes,
      where: whereClause,
      order: [['due_date', 'ASC']],
      subQuery: false
    });

    await refreshLateStatuses(rows);

    return res.status(200).json({
      success: true,
      returns: rows.map(addReturnMeta)
    });
  } catch (error) {
    next(error);
  }
};

const getBookReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookReturn = await BookReturn.findByPk(id, {
      include: returnIncludes
    });

    if (!bookReturn) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found'
      });
    }

    if (!bookReturn.transaction || !ensureCanView(req, bookReturn.transaction)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this return record'
      });
    }

    await refreshLateStatuses(bookReturn);

    return res.status(200).json({
      success: true,
      returnRecord: addReturnMeta(bookReturn)
    });
  } catch (error) {
    next(error);
  }
};

const markBookAsReturned = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bookReturn = await BookReturn.findByPk(id, {
      include: returnIncludes
    });

    if (!bookReturn) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found'
      });
    }

    const transaction = bookReturn.transaction;
    if (!transaction) {
      return res.status(500).json({
        success: false,
        message: 'Associated transaction is missing'
      });
    }

    if (transaction.transaction_type !== 'adopt') {
      return res.status(400).json({
        success: false,
        message: 'Only adoption transactions can be returned'
      });
    }

    if (transaction.receiver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the borrower can return this book'
      });
    }

    if (bookReturn.actual_return_date || bookReturn.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been returned'
      });
    }

    const actualReturnDate = formatDateOnly(new Date());
    const lateDays = calculateLateDays(actualReturnDate, bookReturn.due_date);
    const fineAmount = lateDays * FINE_PER_LATE_DAY;
    const resolvedStatus = lateDays > 0 ? 'late' : 'returned';

    if (fineAmount > 0) {
      try {
        await deductCoins(transaction.receiver_id, fineAmount, 'return_fine', transaction.id);
      } catch (coinError) {
        return res.status(400).json({
          success: false,
          message: coinError.message
        });
      }
    }

    bookReturn.actual_return_date = actualReturnDate;
    bookReturn.fine_amount = fineAmount;
    bookReturn.status = resolvedStatus;
    await bookReturn.save();

    transaction.status = 'completed';
    transaction.returned_at = new Date();
    await transaction.save();

    const book = transaction.book || await Book.findByPk(transaction.book_id);
    if (book) {
      book.status = 'completed';
      await book.save();
    }

    return res.status(200).json({
      success: true,
      message: fineAmount > 0
        ? `Book returned. ${fineAmount} coins deducted as a late fine.`
        : 'Book returned successfully.',
      returnRecord: addReturnMeta(bookReturn),
      fineAmount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBookReturn,
  getBookReturns,
  getMyBookReturns,
  getOwnerPendingReturns,
  getOverdueReturns,
  getBookReturnById,
  markBookAsReturned
};
