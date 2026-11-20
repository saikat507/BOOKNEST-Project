const { BookRequest, Book, User, Transaction, Notification, BookReturn } = require('../models');
const { awardCoins, deductCoins, transferCoins } = require('../utils/coinService');
const { uploadToCloudinary } = require('../config/cloudinary');
const { Op } = require('sequelize');
const { attachNestedVerificationState } = require('../utils/verificationService');
const { getNumericSetting } = require('../utils/settingsService');
require('dotenv').config();

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

/**
 * Create a new book request
 * @route POST /api/requests
 */
const createRequest = async (req, res, next) => {
  try {
    const { book_id, request_type, message, offered_book_id } = req.body;
    const requester_id = req.user.id;

    // Validation
    if (!book_id || !request_type) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and request type are required'
      });
    }

    // Find book
    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check book is available
    if (book.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for request'
      });
    }

    // Check requester is not the book owner
    if (book.user_id === requester_id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own book'
      });
    }

    // Check no duplicate pending request
    const existingRequest = await BookRequest.findOne({
      where: {
        book_id,
        requester_id,
        status: 'pending'
      }
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this book'
      });
    }

    // For exchange: validate offered_book_id
    if (request_type === 'exchange') {
      if (!offered_book_id) {
        return res.status(400).json({
          success: false,
          message: 'Offered book ID is required for exchange request'
        });
      }
      const offeredBook = await Book.findByPk(offered_book_id);
      if (!offeredBook) {
        return res.status(404).json({
          success: false,
          message: 'Offered book not found'
        });
      }
      if (offeredBook.user_id !== requester_id) {
        return res.status(400).json({
          success: false,
          message: 'You can only offer your own books for exchange'
        });
      }
      if (offeredBook.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Your offered book is not available'
        });
      }
    }

    // For buy: check if requester has enough coins
    if (request_type === 'buy') {
      const requester = await User.findByPk(requester_id);
      if (requester.coin_balance < book.coin_required) {
        return res.status(400).json({
          success: false,
          message: `Insufficient coins. You need ${book.coin_required} coins but have ${requester.coin_balance}`
        });
      }
    }

    // For adopt: deduct deposit coins from requester if coin_required > 0
    if (request_type === 'adopt' && book.coin_required > 0) {
      try {
        await deductCoins(
          requester_id,
          book.coin_required,
          'adopt_deposit'
        );
      } catch (coinError) {
        return res.status(400).json({
          success: false,
          message: `Insufficient coins for adopt deposit. You need ${book.coin_required} coins but have insufficient balance.`
        });
      }
    }

    // Create request
    const bookRequest = await BookRequest.create({
      book_id,
      requester_id,
      request_type,
      message,
      offered_book_id: request_type === 'exchange' ? offered_book_id : null
    });

    // Create notification for book owner
    const requester = await User.findByPk(requester_id);
    await Notification.create({
      user_id: book.user_id,
      type: 'request',
      title: 'New Book Request',
      message: `${requester.name} sent a request for your "${book.title}" book`,
      reference_id: bookRequest.id
    });

    // Fetch request with requester details
    await bookRequest.reload({
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'profile_image_url']
      }
    });
    const enrichedRequest = await attachNestedVerificationState(bookRequest, 'requester');

    return res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request: enrichedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests for a book (book owner only)
 * @route GET /api/books/:bookId/requests
 */
const getBookRequests = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    // Find book
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user is book owner
    if (book.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these requests'
      });
    }

    // Get all requests for this book
    const requests = await BookRequest.findAll({
      where: { book_id: bookId },
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'email', 'phone', 'facebook_url', 'profile_image_url']
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      requests: await attachNestedVerificationState(requests, 'requester')
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests made by current user
 * @route GET /api/my-requests
 */
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await BookRequest.findAll({
      where: { requester_id: req.user.id },
      include: {
        model: Book,
        as: 'book',
        attributes: ['id', 'title', 'author', 'cover_image_url', 'listing_type', 'status']
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a book request
 * @route PATCH /api/requests/:requestId/approve
 */
const approveRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    let returnRecord = null;

    // Find request
    const bookRequest = await BookRequest.findByPk(requestId);
    if (!bookRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find book
    const book = await Book.findByPk(bookRequest.book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user is book owner
    if (book.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve this request'
      });
    }

    // Update request status
    bookRequest.status = 'approved';
    await bookRequest.save();

    // Update book status to 'pending'
    book.status = 'pending';
    await book.save();

    // Reject all other pending requests for this book
    await BookRequest.update(
      { status: 'rejected' },
      {
        where: {
          book_id: bookRequest.book_id,
          id: { [Op.ne]: requestId },
          status: 'pending'
        }
      }
    );

    // Create Transaction record
    const transaction = await Transaction.create({
      book_id: bookRequest.book_id,
      giver_id: book.user_id,
      receiver_id: bookRequest.requester_id,
      request_id: bookRequest.id,
      transaction_type: bookRequest.request_type === 'buy' ? 'sell' : bookRequest.request_type,
      coin_amount: bookRequest.request_type === 'buy' ? (book.price || 0) : (book.coin_required || 0),
      status: 'ongoing'
    });

    if (bookRequest.request_type === 'adopt') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (parseInt(book.return_days, 10) || 14));
      const formattedDueDate = formatDateOnly(dueDate);

      transaction.return_date = formattedDueDate;
      transaction.due_date = formattedDueDate;
      await transaction.save();

      [returnRecord] = await BookReturn.findOrCreate({
        where: { transaction_id: transaction.id },
        defaults: {
          transaction_id: transaction.id,
          due_date: formattedDueDate,
          actual_return_date: null,
          fine_amount: 0,
          status: 'borrowed'
        }
      });
    }

    // If exchange: also set the offered book status to 'pending'
    if (bookRequest.request_type === 'exchange' && bookRequest.offered_book_id) {
      const offeredBook = await Book.findByPk(bookRequest.offered_book_id);
      if (offeredBook) {
        offeredBook.status = 'pending';
        await offeredBook.save();
      }
    }

    // Award 5 coins to giver on adopt approval
    if (bookRequest.request_type === 'adopt') {
      try {
        await awardCoins(
          book.user_id,
          await getNumericSetting('adopt_reward'),
          'adopt_reward',
          transaction.id
        );
      } catch (coinError) {
        console.error('Coin award error on adopt approve:', coinError.message);
      }
    }

    // Create notification for requester
    const requester = await User.findByPk(bookRequest.requester_id);
    await Notification.create({
      user_id: bookRequest.requester_id,
      type: 'approved',
      title: 'Request Approved',
      message: `Your request has been approved! You have been selected for "${book.title}".`,
      reference_id: bookRequest.id
    });

    // Reload request with details
    await bookRequest.reload({
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'profile_image_url']
      }
    });
    const enrichedRequest = await attachNestedVerificationState(bookRequest, 'requester');

    return res.status(200).json({
      success: true,
      message: 'Request approved successfully',
      request: enrichedRequest,
      transaction,
      returnRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a book request
 * @route PATCH /api/requests/:requestId/reject
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Find request
    const bookRequest = await BookRequest.findByPk(requestId);
    if (!bookRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find book
    const book = await Book.findByPk(bookRequest.book_id);

    // Check if user is book owner
    if (book.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject this request'
      });
    }

    // Update request status
    bookRequest.status = 'rejected';
    await bookRequest.save();

    // Create notification for requester
    await Notification.create({
      user_id: bookRequest.requester_id,
      type: 'rejected',
      title: 'Request Rejected',
      message: `Your request was rejected. Someone else was selected for "${book.title}".`,
      reference_id: bookRequest.id
    });

    await bookRequest.reload({
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'name']
      }
    });
    const enrichedRequest = await attachNestedVerificationState(bookRequest, 'requester');

    return res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      request: enrichedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a transaction
 * @route PATCH /api/requests/:requestId/complete
 */
const completeTransaction = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Find request
    const bookRequest = await BookRequest.findByPk(requestId);
    if (!bookRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      where: { request_id: requestId }
    });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is giver or receiver
    if (transaction.giver_id !== req.user.id && transaction.receiver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this transaction'
      });
    }

    // Check if already completed
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is already completed'
      });
    }

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Update book request status
    bookRequest.status = 'completed';
    await bookRequest.save();

    // Update book status
    const book = await Book.findByPk(transaction.book_id);
    book.status = 'completed';
    await book.save();

    // For exchange: also set the offered book status to 'completed'
    if (transaction.transaction_type === 'exchange') {
      const bookRequest = await BookRequest.findByPk(transaction.request_id);
      if (bookRequest && bookRequest.offered_book_id) {
        const offeredBook = await Book.findByPk(bookRequest.offered_book_id);
        if (offeredBook) {
          offeredBook.status = 'completed';
          await offeredBook.save();
        }
      }
    }

    // Award coins based on transaction type
    const transactionType = transaction.transaction_type;

    try {
      if (transactionType === 'donate') {
        // Giver gets DONATE_REWARD_COIN
        await awardCoins(
          transaction.giver_id,
          await getNumericSetting('donation_reward'),
          'donate_reward',
          transaction.id
        );
      } else if (transactionType === 'exchange') {
        // Both get EXCHANGE_REWARD_COIN
        await awardCoins(
          transaction.giver_id,
          await getNumericSetting('exchange_reward'),
          'exchange_reward',
          transaction.id
        );
        await awardCoins(
          transaction.receiver_id,
          await getNumericSetting('exchange_reward'),
          'exchange_reward',
          transaction.id
        );
      } else if (transactionType === 'sell') {
        // Giver gets book price in coins (deduct from receiver first)
        await deductCoins(
          transaction.receiver_id,
          transaction.coin_amount,
          'purchase',
          transaction.id
        );
        await awardCoins(
          transaction.giver_id,
          transaction.coin_amount,
          'sell_reward',
          transaction.id
        );
      } else if (transactionType === 'adopt') {
        // Record return and refund deposit to receiver
        const returnedAt = new Date();
        transaction.returned_at = returnedAt;
        await transaction.save();

        const bookReturn = await BookReturn.findOne({
          where: { transaction_id: transaction.id }
        });

        if (bookReturn) {
          const returnedDate = formatDateOnly(returnedAt);
          const lateDays = calculateLateDays(returnedDate, bookReturn.due_date);
          const fineAmount = lateDays * 2;

          if (fineAmount > 0) {
            await deductCoins(
              transaction.receiver_id,
              fineAmount,
              'return_fine',
              transaction.id
            );
          }

          bookReturn.actual_return_date = returnedDate;
          bookReturn.fine_amount = fineAmount;
          bookReturn.status = lateDays > 0 ? 'late' : 'returned';
          await bookReturn.save();
        }

        // Refund deposit coins to receiver (if any were deducted)
        if (transaction.coin_amount > 0) {
          await awardCoins(
            transaction.receiver_id,
            transaction.coin_amount,
            'adopt_refund',
            transaction.id
          );
        }
      }
    } catch (coinError) {
      console.error('Coin award error:', coinError.message);
      return res.status(400).json({
        success: false,
        message: `Transaction completed but coin award failed: ${coinError.message}`
      });
    }

    // Create notifications for both parties
    const giver = await User.findByPk(transaction.giver_id);
    const receiver = await User.findByPk(transaction.receiver_id);

    await Notification.create({
      user_id: transaction.giver_id,
      type: 'coin_update',
      title: 'Transaction Completed',
      message: `${book.title} Transaction completed. You received coins.`,
      reference_id: transaction.id
    });

    await Notification.create({
      user_id: transaction.receiver_id,
      type: 'coin_update',
      title: 'Transaction Completed',
      message: `${book.title} Transaction completed.`,
      reference_id: transaction.id
    });

    return res.status(200).json({
      success: true,
      message: 'Transaction completed successfully',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload ID document for adoption request
 * @route POST /api/requests/:requestId/upload-id
 */
const uploadIDDocument = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Find request
    const bookRequest = await BookRequest.findByPk(requestId);
    if (!bookRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is requester
    if (bookRequest.requester_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload for this request'
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to Cloudinary
    try {
      const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/ids');
      bookRequest.id_document_url = secure_url;
      await bookRequest.save();
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload ID document'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ID document uploaded successfully',
      request: bookRequest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getBookRequests,
  getMyRequests,
  approveRequest,
  rejectRequest,
  completeTransaction,
  uploadIDDocument
};
