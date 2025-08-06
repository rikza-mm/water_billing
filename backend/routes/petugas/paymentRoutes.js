const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/petugas/paymentController');
const { body, param, query } = require('express-validator');

const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { areaRestrictionMiddleware, validateCustomerAccess } = require('../../middleware/areaRestrictionMiddleware');


// ✅ Global Middleware
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'petugas']));
router.use(areaRestrictionMiddleware());

// =======================================================================
// ==================== RUTE-RUTE UTAMA PEMBAYARAN =======================
// =======================================================================

// Rute untuk ALUR PEMBAYARAN TAGIHAN TUNGGAL (paling umum)
// Dipanggil saat petugas melakukan pembayaran untuk satu tagihan spesifik.
router.post('/', [
  body('bill_id').isInt({ min: 1 }).withMessage('bill_id harus angka positif').toInt(),
  body('amount').isFloat({ min: 0 }).withMessage('amount harus angka positif').toFloat(),
  body('method').isIn(['cash', 'transfer', 'qris']).withMessage('method harus cash/transfer/qris').trim(),
  body('use_balance').optional().isBoolean().toBoolean(),
  body('proofUrl').optional().isString().trim()
], paymentController.createPayment);


// Rute untuk SKENARIO KHUSUS: MEMBAYAR HUTANG LAMA

router.post('/pay-debt', [
  body('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt(),
  body('amount').isFloat({ min: 0 }).withMessage('amount harus angka positif').toFloat(),
  body('method').isIn(['cash', 'transfer', 'qris']).withMessage('method harus cash/transfer/qris').trim(),
  body('proofUrl').optional().isString().trim()
], paymentController.payDebt);

// Riwayat pembayaran hutang
router.get('/debt-history/:customer_id', [
  param('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt()
], validateCustomerAccess(), paymentController.getDebtPaymentHistory);




// =======================================================================
// ==================== RUTE-RUTE PENDUKUNG & ANALISIS ===================
// =======================================================================

// Rute untuk menambah saldo (deposit) secara manual
router.post('/deposit/:customer_id', [
  param('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt(),
  body('amount').isFloat({ min: 0 }).withMessage('amount harus angka positif').toFloat(),
  body('method').isIn(['cash', 'transfer', 'qris']).withMessage('method harus cash/transfer/qris').trim()
], paymentController.createDeposit);

// Rute untuk mendapatkan preview/simulasi pembayaran
router.get('/preview', [
  query('customer_id').optional().isInt({ min: 1 }).toInt(),
  query('bill_id').optional().isInt({ min: 1 }).toInt(),
  query('amount').optional().isFloat({ min: 0 }).toFloat(),
  query('method').optional().isIn(['cash', 'transfer', 'qris']).trim()
], paymentController.getPaymentPreview);

// Rute untuk mendapatkan riwayat pembayaran seorang pelanggan
// Middleware `validateCustomerAccess` memastikan petugas hanya bisa akses data di areanya.
router.get('/history/:customer_id', [
  param('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt()
], validateCustomerAccess(), paymentController.getPaymentHistory);

// Rute untuk mendapatkan detail satu pembayaran spesifik (opsional)
router.get('/:payment_id', [
  param('payment_id').isInt({ min: 1 }).withMessage('payment_id harus angka positif').toInt()
], paymentController.getPaymentDetails);


// ✅ Rute riwayat & analisis pembayaran

router.get('/recommendations', paymentController.getPaymentRecommendations); // (opsional) saran pembayaran
router.get('/:payment_id', paymentController.getPaymentDetails);      // Detail pembayaran tertentu (belum diimplementasikan)

module.exports = router;
