const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All routes require authentication
router.get('/balance', verifyToken, coinController.getBalance);
router.get('/ledger', verifyToken, coinController.getLedger);
router.post('/award', verifyToken, requireRole('admin'), coinController.adminAwardCoins);

module.exports = router;
