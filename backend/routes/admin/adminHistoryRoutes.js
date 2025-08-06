const express = require('express');
const router = express.Router();
const adminHistoryController = require('../../controllers/admin/adminHistoryController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, query } = require('express-validator');

// Middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Endpoint utama untuk halaman detail riwayat pelanggan
router.get(
  '/customer/:customerId',
  [
    param('customerId')
      .isInt({ min: 1 })
      .withMessage('ID Pelanggan harus berupa angka positif.')
  ],
  adminHistoryController.getCustomerHistory
);

// Endpoint untuk modal detail pembayaran
router.get(
  '/payment/:paymentId',
  [
    param('paymentId')
      .isInt({ min: 1 })
      .withMessage('ID Pembayaran harus berupa angka positif.')
  ],
  adminHistoryController.getPaymentDetails
);

// Endpoint untuk pencarian/daftar pelanggan
router.get(
  '/customers/list',
  [
    query('search')
      .optional()
      .isString()
      .trim()
      .escape()
      .withMessage('Kata kunci pencarian tidak valid.')
  ],
  adminHistoryController.searchAllCustomers
);

module.exports = router;