const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadIDDocument } = require('../middleware/upload.middleware');

router.get('/', verifyToken, verificationController.getVerifications);
router.get('/:id', verifyToken, verificationController.getVerificationById);
router.post('/', verifyToken, uploadIDDocument, verificationController.createVerificationRequest);
router.patch('/:id/status', verifyToken, verificationController.reviewVerificationStatus);

module.exports = router;
