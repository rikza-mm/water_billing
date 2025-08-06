const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/petugas/permissionController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { query } = require('express-validator');

// Middleware
router.use(authMiddleware);
router.use(roleMiddleware(['petugas']));

// ✅ Lightweight permission check for real-time sync
router.get('/check', [
  query('force').optional().isBoolean().toBoolean()
], permissionController.checkPermissions);

// ✅ Detailed permission info with statistics
router.get('/detailed', [
  query('includeStats').optional().isBoolean().toBoolean()
], permissionController.getDetailedPermissions);

// ✅ Force refresh permissions
router.post('/refresh', [
  query('force').optional().isBoolean().toBoolean()
], permissionController.refreshPermissions);

module.exports = router;
