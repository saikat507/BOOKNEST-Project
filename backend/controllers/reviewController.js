const { Review, User, Transaction } = require('../models');
const { awardCoins } = require('../utils/coinService');
const { Op } = require('sequelize');
const { attachNestedVerificationState, attachVerificationState } = require('../utils/verificationService');
require('dotenv').config();

/**
 * Create a review for a user
 * @route POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const { reviewed_user_id, rating, comment, book_id } = req.body;
    const reviewer_id = req.user.id;

    // Validation
    if (!reviewed_user_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Reviewed user ID and rating are required'
      });
    }

    // Validate rating is between 1-5
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }

    // Check reviewer is not reviewing themselves
    if (reviewer_id === parseInt(reviewed_user_id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
    }

    // Check if reviewed user exists
    const reviewedUser = await User.findByPk(reviewed_user_id);
    if (!reviewedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reviewed user not found'
      });
    }

    // Check if a completed transaction exists between the two users (optional but recommended)
    const completedTransaction = await Transaction.findOne({
      where: {
        status: 'completed',
        [Op.or]: [
          {
            giver_id: reviewer_id,
            receiver_id: reviewed_user_id
          },
          {
            giver_id: reviewed_user_id,
            receiver_id: reviewer_id
          }
        ]
      }
    });

    if (!completedTransaction) {
      console.warn(`Review without completed transaction: reviewer ${reviewer_id} reviewing ${reviewed_user_id}`);
    }

    // Check for duplicate review for same pair + book
    const whereClause = {
      reviewer_id,
      reviewed_user_id
    };

    if (book_id) {
      whereClause.book_id = book_id;
    } else {
      whereClause.book_id = null;
    }

    const existingReview = await Review.findOne({
      where: whereClause
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this user for this book'
      });
    }

    // Create review
    const review = await Review.create({
      reviewer_id,
      reviewed_user_id,
      book_id: book_id || null,
      rating,
      comment: comment || null
    });

    // Award coin bonus to reviewer
    try {
      await awardCoins(reviewer_id, 2, 'review_bonus', review.id);
    } catch (coinError) {
      console.error('Failed to award review bonus coins:', coinError.message);
      // Don't fail the review creation if coin award fails
    }

    // Reload with reviewer details
    await review.reload({
      include: {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'profile_image_url']
      }
    });
    const enrichedReview = await attachNestedVerificationState(review, 'reviewer');

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: enrichedReview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews for a user
 * @route GET /api/reviews/user/:userId
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find all reviews for this user
    const reviews = await Review.findAll({
      where: { reviewed_user_id: userId },
      include: {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'profile_image_url']
      },
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    let averageRating = null;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }

    const enrichedUser = await attachVerificationState({
      id: user.id,
      name: user.name,
      profile_image_url: user.profile_image_url
    });

    return res.status(200).json({
      success: true,
      reviews: await attachNestedVerificationState(reviews, 'reviewer'),
      averageRating,
      totalReviews: reviews.length,
      user: enrichedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews
};
