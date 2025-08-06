const express = require('express');
const router = express.Router();
const CustomerReportController = require('../../controllers/admin/customerReportController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/analytics', CustomerReportController.getAnalytics);

module.exports = router;