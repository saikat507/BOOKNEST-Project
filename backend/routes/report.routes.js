const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, reportController.getReports);
router.get('/:id', verifyToken, reportController.getReportById);
router.post('/', verifyToken, reportController.createReport);
router.patch('/:id/status', verifyToken, reportController.updateReportStatus);

module.exports = router;
