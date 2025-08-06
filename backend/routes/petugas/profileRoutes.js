const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/petugas/profileController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { query } = require('express-validator');

/**
 * @route   GET /api/v1/petugas/profile
 * @desc    Mengambil data profil lengkap untuk petugas yang sedang login.
 * @access  Private (hanya 'petugas')
 */
router.get(
  '/',
  authMiddleware,            // Pastikan user sudah login
  roleMiddleware(['petugas']), // Pastikan user adalah petugas
  [
    query('includeDetails').optional().isBoolean().toBoolean()
  ],
  profileController.getMyProfile
);

module.exports = router;