const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// All admin routes require authentication and admin role
const adminAuth = [requireAuth, requireAdmin];

// Dashboard
router.get('/stats', adminAuth, adminController.getDashboardStats);

// User management
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/:userId', adminAuth, adminController.getUserDetails);
router.post('/users/:userId/block', adminAuth, adminController.blockUser);
router.post('/users/:userId/unblock', adminAuth, adminController.unblockUser);
router.post('/users/:userId/ban', adminAuth, adminController.banUser);
router.post('/users/:userId/warn', adminAuth, adminController.warnUser);
router.put('/users/:userId/block', adminAuth, adminController.toggleBlockUser);
router.put('/users/:userId/verify', adminAuth, adminController.verifyUser);

// Verification management
router.get('/verifications', adminAuth, adminController.getPendingVerifications);
router.post('/verifications/:id/approve', adminAuth, adminController.approveVerification);
router.post('/verifications/:id/reject', adminAuth, adminController.rejectVerification);
router.post('/verifications/:id/request-reupload', adminAuth, adminController.requestVerificationReupload);

// Book management
router.get('/books', adminAuth, adminController.getAllBooks);
router.delete('/books/:bookId', adminAuth, adminController.adminDeleteBook);

// Transaction monitoring
router.get('/transactions', adminAuth, adminController.getTransactions);

// Coin management
router.get('/coins/transactions', adminAuth, adminController.getCoinTransactions);
router.post('/coins/award', adminAuth, adminController.adminAwardCoins);
router.post('/coins/adjust', adminAuth, adminController.adminAdjustCoins);

// Settings
router.get('/settings', adminAuth, adminController.getSettings);
router.put('/settings', adminAuth, adminController.updateSettings);

// Reports
router.get('/reports', adminAuth, adminController.getReports);
router.post('/reports/:id/resolve', adminAuth, adminController.resolveReport);

module.exports = router;
