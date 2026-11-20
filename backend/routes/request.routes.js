const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadIDDocument } = require('../middleware/upload.middleware');

// All routes require authentication
router.post('/', verifyToken, requestController.createRequest);
router.get('/my', verifyToken, requestController.getMyRequests);
router.get('/book/:bookId', verifyToken, requestController.getBookRequests);
router.patch('/:requestId/approve', verifyToken, requestController.approveRequest);
router.patch('/:requestId/reject', verifyToken, requestController.rejectRequest);
router.patch('/:requestId/complete', verifyToken, requestController.completeTransaction);
router.post('/:requestId/upload-id', verifyToken, uploadIDDocument, requestController.uploadIDDocument);

module.exports = router;
