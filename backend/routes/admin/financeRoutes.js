const express = require('express');
const router = express.Router();
const FinanceController = require('../../controllers/admin/financeController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { body, param, query } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// RUTE UTAMA: Satu endpoint untuk mengambil semua data dasbor
router.post(
  '/dashboard-data',
  [
    body('start_date').isISO8601().withMessage('Tanggal awal diperlukan dan harus format ISO8601.'),
    body('end_date').isISO8601().withMessage('Tanggal akhir diperlukan dan harus format ISO8601.')
  ],
  FinanceController.getDashboardData
);

// RUTE MANAJEMEN: Endpoint untuk membuat transaksi
router.post(
  '/transactions',
  [
    body('type').isIn(['income', 'expense']).withMessage('Tipe transaksi harus income atau expense.'),
    body('amount').isFloat({ min: 0 }).withMessage('Jumlah harus berupa angka positif.'),
    body('date').isISO8601().withMessage('Tanggal transaksi harus format ISO8601.'),
    body('category').isString().notEmpty().withMessage('Kategori wajib diisi.'),
    body('description').optional().isString().trim().escape(),
    body('asset_name').optional().isString().trim().escape()
  ],
  FinanceController.createTransaction
);

router.post(
  '/equity-transactions',
  [
    body('type').isIn(['MODAL_AWAL', 'SETORAN_MODAL', 'PRIVE']).withMessage('Tipe ekuitas tidak valid.'),
    body('amount').isFloat({ min: 0 }).withMessage('Jumlah harus berupa angka positif.'),
    body('transaction_date').isISO8601().withMessage('Tanggal transaksi harus format ISO8601.'),
    body('description').isString().notEmpty().withMessage('Deskripsi wajib diisi.').trim().escape()
  ],
  FinanceController.createEquityTransaction
);

router.post(
  '/close-period',
  [
    body('period').isString().notEmpty().withMessage('Periode tutup buku wajib diisi.').trim().escape()
  ],
  FinanceController.closePeriod
);

module.exports = router;