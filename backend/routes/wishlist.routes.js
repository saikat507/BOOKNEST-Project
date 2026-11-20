const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, wishlistController.getWishlist);
router.post('/', verifyToken, wishlistController.addWishlist);
router.delete('/:id', verifyToken, wishlistController.removeWishlist);

module.exports = router;
