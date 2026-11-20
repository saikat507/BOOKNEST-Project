const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth.middleware');

// Public route
router.get('/user/:userId', reviewController.getUserReviews);

// Protected routes
router.post('/', verifyToken, reviewController.createReview);

module.exports = router;
