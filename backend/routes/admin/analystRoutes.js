const express = require('express');
const router = express.Router();
const AnalystController = require('../../controllers/admin/analystController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, body } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini, hanya admin yang boleh akses
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Endpoint utama untuk mengambil semua data dasbor analis
router.post(
  '/dashboard',
  [
    body('start_date')
      .isString().withMessage('Tanggal awal harus berupa string.')
      .notEmpty().withMessage('Tanggal awal diperlukan.')
      .isISO8601().withMessage('Format tanggal awal tidak valid.')
      .trim(),
    body('end_date')
      .isString().withMessage('Tanggal akhir harus berupa string.')
      .notEmpty().withMessage('Tanggal akhir diperlukan.')
      .isISO8601().withMessage('Format tanggal akhir tidak valid.')
      .trim()
  ],
  AnalystController.getAnalystDashboardData
);

// ENDPOINT BARU: Untuk detail kinerja petugas
router.post(
  '/officer-detail/:officerId',
  [
    param('officerId')
      .isInt({ min: 1 }).withMessage('ID Petugas harus berupa angka positif.')
      .toInt(),
    body('start_date')
      .isString().withMessage('Tanggal awal harus berupa string.')
      .notEmpty().withMessage('Tanggal awal diperlukan.')
      .isISO8601().withMessage('Format tanggal awal tidak valid.')
      .trim(),
    body('end_date')
      .isString().withMessage('Tanggal akhir harus berupa string.')
      .notEmpty().withMessage('Tanggal akhir diperlukan.')
      .isISO8601().withMessage('Format tanggal akhir tidak valid.')
      .trim()
  ],
  AnalystController.getOfficerDetail
);

// ENDPOINT BARU: Untuk detail/ledger pelanggan
router.get(
  '/customer-ledger/:customerId',
  [
    param('customerId')
      .isInt({ min: 1 }).withMessage('ID Pelanggan harus berupa angka positif.')
      .toInt()
  ],
  AnalystController.getCustomerLedger
);

module.exports = router;