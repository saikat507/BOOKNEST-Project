const { Wishlist, Book, User } = require('../models');
const { attachNestedVerificationState } = require('../utils/verificationService');

/**
 * Get wishlist entries for current user
 * @route GET /api/wishlist
 */
const getWishlist = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const { count, rows } = await Wishlist.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'profile_image_url']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      wishlist: await Promise.all(rows.map(async (item) => ({
        ...item.toJSON(),
        book: await attachNestedVerificationState(item.book, 'owner')
      }))),
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
 * Add a book to wishlist
 * @route POST /api/wishlist
 */
const addWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({
        success: false,
        message: 'book_id is required'
      });
    }

    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const [wishlist, created] = await Wishlist.findOrCreate({
      where: { user_id: userId, book_id },
      defaults: { user_id: userId, book_id }
    });

    if (!created) {
      return res.status(409).json({
        success: false,
        message: 'Book is already in your wishlist'
      });
    }

    const result = await Wishlist.findByPk(wishlist.id, {
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'profile_image_url']
            }
          ]
        }
      ]
    });

    const enrichedResult = {
      ...result.toJSON(),
      book: await attachNestedVerificationState(result.book, 'owner')
    };

    return res.status(201).json({
      success: true,
      message: 'Book added to wishlist',
      wishlist: enrichedResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a wishlist entry
 * @route DELETE /api/wishlist/:id
 */
const removeWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const wishlist = await Wishlist.findOne({
      where: { id, user_id: userId }
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    await wishlist.destroy();

    return res.status(200).json({
      success: true,
      message: 'Book removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addWishlist,
  removeWishlist
};
