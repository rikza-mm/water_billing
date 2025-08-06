// routes/petugas/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const PetugasDashboardController = require('../../controllers/petugas/dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { query } = require('express-validator');

// Terapkan semua middleware yang diperlukan
router.use(authMiddleware);
router.use(roleMiddleware(['petugas']));
// areaRestrictionMiddleware tidak lagi diperlukan di sini karena user_id petugas
// sudah langsung dikirim ke stored procedure yang filternya sudah built-in.

/**
 * @route   GET /api/v1/petugas/dashboard/
 * @desc    [ENDPOINT UTAMA] Mengambil semua data komprehensif untuk dasbor petugas.
 * @access  Private (petugas)
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt()
], PetugasDashboardController.getDashboardData);

// Rute lain seperti /profile bisa tetap ada jika melayani tujuan yang berbeda.

module.exports = router;