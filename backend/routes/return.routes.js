const express = require('express');
const router = express.Router();
const bookReturnController = require('../controllers/bookReturnController');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/my', verifyToken, bookReturnController.getMyBookReturns);
router.get('/owner/pending', verifyToken, bookReturnController.getOwnerPendingReturns);
router.get('/overdue', verifyToken, bookReturnController.getOverdueReturns);
router.get('/', verifyToken, bookReturnController.getBookReturns);
router.get('/:id', verifyToken, bookReturnController.getBookReturnById);
router.post('/', verifyToken, bookReturnController.createBookReturn);
router.put('/:id/return', verifyToken, bookReturnController.markBookAsReturned);
router.patch('/:id/return', verifyToken, bookReturnController.markBookAsReturned);

module.exports = router;
