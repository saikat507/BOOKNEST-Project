const { Book, User, Review, Transaction, BookRequest } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');
const { Op, fn, col, where } = require('sequelize');
const { attachNestedVerificationState } = require('../utils/verificationService');
const fs = require('fs');
require('dotenv').config();

/**
 * Get all books with filters and pagination
 * @route GET /api/books
 */
const getAllBooks = async (req, res, next) => {
  try {
    const {
      type,
      listing_type,
      genre,
      condition,
      status,
      search,
      page = 1,
      limit = 12
    } = req.query;
    const requestedListingType = listing_type || type;

    // Build where clause
    const whereClause = {};

    // Default to only showing available books (hide completed/pending/closed)
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'available';
    }

    if (requestedListingType) {
      whereClause.listing_type = requestedListingType;
    }
    if (genre) {
      whereClause.genre = genre;
    }
    if (condition) {
      whereClause.condition = condition;
    }
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch books
    const { count, rows } = await Book.findAndCountAll({
      where: whereClause,
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'profile_image_url']
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      books: await attachNestedVerificationState(rows, 'owner'),
      total: count,
      page: parseInt(page),
      totalPages,
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book by ID with details
 * @route GET /api/books/:id
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'profile_image_url', 'email', 'facebook_url']
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          include: {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'name', 'profile_image_url']
          }
        }
      ]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Calculate average rating
    const avgRating = book.reviews.length > 0
      ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(1)
      : null;

    // Get request count
    const requestCount = await book.countRequests();

    const bookData = await attachNestedVerificationState(book, 'owner');
    bookData.averageRating = avgRating;
    bookData.requestCount = requestCount;

    return res.status(200).json({
      success: true,
      book: bookData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new book
 * @route POST /api/books
 */
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      genre,
      condition,
      description,
      listing_type,
      price,
      coin_required,
      pickup_location,
      return_days
    } = req.body;

    // Validation
    if (!title || !author || !condition || !listing_type || !pickup_location) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, condition, listing_type, and pickup_location are required'
      });
    }

    if (listing_type === 'sell' && !price) {
      return res.status(400).json({
        success: false,
        message: 'Price is required for sell listing'
      });
    }

    // Handle file upload
    let coverImageUrl = null;
    if (req.file) {
      try {
        const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/books');
        coverImageUrl = secure_url;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload cover image'
        });
      }
    }

    // Create book
    const book = await Book.create({
      user_id: req.user.id,
      title,
      author,
      genre,
      condition,
      description,
      cover_image_url: coverImageUrl,
      listing_type,
      price: listing_type === 'sell' ? price : null,
      coin_required: coin_required || 0,
      pickup_location,
      return_days: listing_type === 'adopt' ? return_days : null
    });

    // Fetch book with owner details
    await book.reload({
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'profile_image_url']
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a book
 * @route PUT /api/books/:id
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      genre,
      condition,
      description,
      listing_type,
      price,
      coin_required,
      pickup_location,
      return_days,
      status
    } = req.body;

    // Find book
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check ownership (owner or admin)
    if (book.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this book'
      });
    }

    // Handle file upload if new file provided
    if (req.file) {
      try {
        // Delete old image if exists
        if (book.cover_image_url) {
          // In production, you might want to delete from Cloudinary
        }

        const { secure_url } = await uploadToCloudinary(req.file.path, 'booknest/books');
        book.cover_image_url = secure_url;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload cover image'
        });
      }
    }

    // Update fields
    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;
    if (condition) book.condition = condition;
    if (description) book.description = description;
    if (listing_type) book.listing_type = listing_type;
    if (price !== undefined) book.price = listing_type === 'sell' ? price : null;
    if (coin_required !== undefined) book.coin_required = coin_required;
    if (pickup_location) book.pickup_location = pickup_location;
    if (return_days !== undefined) book.return_days = listing_type === 'adopt' ? return_days : null;
    if (status) book.status = status;

    await book.save();

    // Reload with owner details
    await book.reload({
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'profile_image_url']
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book
 * @route DELETE /api/books/:id
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check ownership (owner or admin)
    if (book.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this book'
      });
    }

    // Delete from database
    await book.destroy();

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get books the current user RECEIVED (approved/completed requests where I'm requester)
 * @route GET /api/books/my
 */
const getMyBooks = async (req, res, next) => {
  try {
    const receivedRequests = await BookRequest.findAll({
      where: {
        requester_id: req.user.id,
        status: { [Op.in]: ['approved', 'completed'] }
      },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            { model: User, as: 'owner', attributes: ['id', 'name', 'profile_image_url'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const books = await Promise.all(receivedRequests.map(async (bookRequest) => {
      const bookData = bookRequest.book.toJSON();
      const enrichedBook = await attachNestedVerificationState(bookData, 'owner');
      const transaction = await Transaction.findOne({ where: { request_id: bookRequest.id } });
      bookData.process = bookRequest.request_type;
      bookData.owner = enrichedBook.owner;
      bookData.from_user = enrichedBook.owner;
      bookData.request_id = bookRequest.id;
      bookData.transaction_id = transaction?.id || null;
      bookData.transaction_status = transaction?.status || null;
      return bookData;
    }));

    return res.status(200).json({
      success: true,
      books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get books the current user GAVE (approved/completed requests for my books)
 * @route GET /api/books/my-history
 */
const getMyGivenBooks = async (req, res, next) => {
  try {
    const givenRequests = await BookRequest.findAll({
      where: {
        status: { [Op.in]: ['approved', 'completed'] }
      },
      include: [
        {
          model: Book,
          as: 'book',
          where: { user_id: req.user.id }
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'profile_image_url']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enrichedRequests = await attachNestedVerificationState(givenRequests, 'requester');
    const books = await Promise.all(enrichedRequests.map(async (bookRequest) => {
      const bookData = bookRequest.book && typeof bookRequest.book.toJSON === 'function'
        ? bookRequest.book.toJSON()
        : { ...bookRequest.book };
      const transaction = await Transaction.findOne({ where: { request_id: bookRequest.id } });
      bookData.process = bookRequest.request_type;
      bookData.to_user = bookRequest.requester;
      bookData.request_id = bookRequest.id;
      bookData.transaction_id = transaction?.id || null;
      bookData.transaction_status = transaction?.status || null;
      return bookData;
    }));

    return res.status(200).json({
      success: true,
      books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get books the current user LISTED that are still available (not taken)
 * @route GET /api/books/my-listed
 */
const getMyListedBooks = async (req, res, next) => {
  try {
    const books = await Book.findAll({
      where: {
        user_id: req.user.id,
        status: 'available'
      },
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'profile_image_url']
      },
      order: [['createdAt', 'DESC']]
    });

    // Add request count to each book
    const booksWithCounts = await Promise.all(
      books.map(async (book) => {
        const requestCount = await book.countRequests();
        return {
          ...book.toJSON(),
          requestCount
        };
      })
    );
    const enrichedBooksWithCounts = await attachNestedVerificationState(booksWithCounts, 'owner');

    return res.status(200).json({
      success: true,
      books: enrichedBooksWithCounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ALL books owned by the current user (regardless of status)
 * Used by MyRequests to fetch received requests for all user's books
 * @route GET /api/books/my-owned
 */
const getMyOwnedBooks = async (req, res, next) => {
  try {
    const books = await Book.findAll({
      where: { user_id: req.user.id },
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'profile_image_url']
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      books: await attachNestedVerificationState(books, 'owner')
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  getMyGivenBooks,
  getMyListedBooks,
  getMyOwnedBooks
};
