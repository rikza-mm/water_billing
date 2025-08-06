const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/admin/dashboardController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { query } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Endpoint utama untuk mengambil semua data dasbor admin
router.get(
  '/summary',
  [
    // Contoh: jika ingin mendukung filter tanggal, tambahkan validasi di sini
    query('start_date').optional().isISO8601().withMessage('Format tanggal awal tidak valid.'),
    query('end_date').optional().isISO8601().withMessage('Format tanggal akhir tidak valid.')
  ],
  DashboardController.getDashboardSummary
);

module.exports = router;