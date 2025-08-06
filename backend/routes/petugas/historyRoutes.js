const express = require('express');
const router = express.Router();
const historyController = require('../../controllers/petugas/historyController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { areaRestrictionMiddleware, validateCustomerAccess } = require('../../middleware/areaRestrictionMiddleware');
const { param, query } = require('express-validator');

// Middleware
router.use(authMiddleware);
router.use(roleMiddleware(['petugas']));
router.use(areaRestrictionMiddleware()); // ✅ AREA RESTRICTION: Tambahkan middleware area

// Mendapatkan data riwayat dengan filter
router.get('/', [
  query('customerId').optional().isInt({ min: 1 }).toInt(),
  query('customerName').optional().isString().trim().escape(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('paymentStatus').optional().isIn(['all', 'paid', 'unpaid', 'partial']).trim().escape(),
  query('area').optional().isString().trim().escape(),
  query('period').optional().isString().trim().escape(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], historyController.getHistories);

// Mendapatkan detail riwayat untuk pelanggan tertentu
router.get('/customer/:customerId/detailed', [
  param('customerId').isInt({ min: 1 }).withMessage('customerId harus angka positif').toInt()
], validateCustomerAccess(), historyController.getDetailedHistory);

// ✅ RUTE BARU: untuk mengambil riwayat pembayaran hutang
router.get('/customer/:customerId/debt-payments', [
  param('customerId').isInt({ min: 1 }).withMessage('customerId harus angka positif').toInt()
], validateCustomerAccess(), historyController.getDebtPaymentHistory);

// Mengekspor data riwayat
router.get('/export', historyController.exportHistory);

// Mendapatkan daftar area untuk filter
router.get('/areas', historyController.getAreas);

module.exports = router;
