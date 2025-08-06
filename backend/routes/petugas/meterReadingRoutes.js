const express = require('express');
const router = express.Router();
const meterReadingController = require('../../controllers/petugas/meterReadingController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { areaRestrictionMiddleware, validateCustomerAccess } = require('../../middleware/areaRestrictionMiddleware');
const { body, param } = require('express-validator');

// Middleware
router.use(authMiddleware);
router.use(roleMiddleware(['petugas']));
router.use(areaRestrictionMiddleware()); // ✅ AREA RESTRICTION: Tambahkan middleware area


// ✅ Rute baru untuk mencatat dan menghitung tagihan
router.post('/record-and-bill', [
  body('customerId').isInt({ min: 1 }).withMessage('customerId harus angka positif').toInt(),
  body('currentReading').isFloat({ min: 0 }).withMessage('currentReading harus angka >= 0').toFloat(),
  body('readingDate').isISO8601().withMessage('readingDate harus format tanggal ISO8601'),
  body('imageUrl').isString().notEmpty().withMessage('imageUrl wajib diisi').trim(),
  body('notes').optional().isString().trim().escape()
], meterReadingController.recordAndBill);

// ✅ Rute baru untuk membatalkan
router.post('/cancel', [
  body('billId').isInt({ min: 1 }).withMessage('billId harus angka positif').toInt()
], meterReadingController.cancelReadingAndBill);


// Validasi pembacaan sebelum input
router.post('/validate', [
  body('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt(),
  body('current_reading').isFloat({ min: 0 }).withMessage('current_reading harus angka >= 0').toFloat(),
  body('reading_date').isISO8601().withMessage('reading_date harus format tanggal ISO8601')
], validateCustomerAccess(), meterReadingController.validateReading);

// Riwayat pembacaan meter pelanggan
router.get('/history/:customer_id', [
  param('customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt()
], validateCustomerAccess(), meterReadingController.getReadingHistory);

// Sinkronisasi pembacaan offline
router.post('/sync-offline', [
  body('readings').isArray({ min: 1 }).withMessage('readings harus array minimal 1 data'),
  body('readings.*.customer_id').isInt({ min: 1 }).withMessage('customer_id harus angka positif').toInt(),
  body('readings.*.current_reading').isFloat({ min: 0 }).withMessage('current_reading harus angka >= 0').toFloat(),
  body('readings.*.reading_date').isISO8601().withMessage('reading_date harus format tanggal ISO8601'),
  body('readings.*.imageUrl').isString().notEmpty().withMessage('imageUrl wajib diisi').trim(),
  body('readings.*.notes').optional().isString().trim().escape()
], meterReadingController.syncOfflineReadings);

module.exports = router;