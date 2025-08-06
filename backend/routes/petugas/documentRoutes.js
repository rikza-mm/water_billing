const express = require('express');
const router = express.Router();
const documentController = require('../../controllers/petugas/documentController');
const { param, body } = require('express-validator');

// Middleware keamanan (wajib ada di setiap rute petugas)
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

// Semua rute di file ini akan dilindungi oleh middleware berikut
router.use(authMiddleware);
router.use(roleMiddleware(['petugas', 'admin'])); // Admin juga boleh akses

// Definisikan endpoint
// Contoh: POST /petugas/documents/payment
router.post('/payment/:paymentId', [
  param('paymentId').isInt({ min: 1 }).withMessage('paymentId harus angka positif').toInt(),
  body('document_type').isIn(['receipt', 'history']).withMessage('Tipe dokumen tidak valid'),
  body('url').isString().notEmpty().withMessage('URL dokumen wajib diisi').trim()
], documentController.saveDocument);

// Contoh: GET /petugas/documents/payment/9/
router.get('/payment/:paymentId', [
  param('paymentId').isInt({ min: 1 }).withMessage('paymentId harus angka positif').toInt()
], documentController.getDocuments);

// ✅ RUTE BARU: Untuk mengambil URL dokumen berdasarkan paymentId dan tipe
router.get('/payment/:paymentId/:docType', [
  param('paymentId').isInt({ min: 1 }).withMessage('paymentId harus angka positif').toInt(),
  param('docType').isIn(['receipt', 'history']).withMessage('Tipe dokumen tidak valid')
], documentController.getDocument);

module.exports = router;