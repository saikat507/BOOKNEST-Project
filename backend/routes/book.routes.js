const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadBookCover } = require('../middleware/upload.middleware');

// Protected routes
router.get('/my', verifyToken, bookController.getMyBooks);
router.get('/my-history', verifyToken, bookController.getMyGivenBooks);
router.get('/my-listed', verifyToken, bookController.getMyListedBooks);
router.get('/my-owned', verifyToken, bookController.getMyOwnedBooks);
router.post('/', verifyToken, uploadBookCover, bookController.createBook);

// Public routes (order matters - specific routes before parameterized)
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Protected routes (update/delete need to come after public get routes)
router.put('/:id', verifyToken, uploadBookCover, bookController.updateBook);
router.delete('/:id', verifyToken, bookController.deleteBook);

module.exports = router;
