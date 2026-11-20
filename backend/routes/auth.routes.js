const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadIDDocument, uploadProfileImage } = require('../middleware/upload.middleware');
const { loginRateLimit, sensitiveAuthRateLimit } = require('../middleware/loginThrottle');

// Public routes
router.post('/register', sensitiveAuthRateLimit, authController.register);
router.post('/login', loginRateLimit, authController.login);
router.post('/admin/login', loginRateLimit, authController.adminLogin);
router.post('/forgot-password', sensitiveAuthRateLimit, authController.forgotPassword);
router.post('/reset-password', sensitiveAuthRateLimit, authController.resetPassword);
router.put('/change-password', verifyToken, authController.changePassword);

// Protected routes
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, uploadProfileImage, authController.updateProfile);
router.post('/upload-id', verifyToken, uploadIDDocument, authController.uploadID);

module.exports = router;
