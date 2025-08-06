const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/petugas/customerController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { areaRestrictionMiddleware } = require('../../middleware/areaRestrictionMiddleware');
const { param, query, body } = require('express-validator');

// Middleware
router.use(authMiddleware);
router.use(roleMiddleware(['petugas']));
router.use(areaRestrictionMiddleware()); 

// Routes
router.get('/search-customers', [
  query('search').optional().isString().trim().escape(),
  query('status').optional().isString().trim().escape(),
  query('usage').optional().isString().trim().escape(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt()
], customerController.getCustomers);

// ✅ RUTE BARU: Untuk pencarian spesifik berdasarkan ID
// Menggunakan parameter rute (:customerId) lebih sesuai untuk mengambil satu entitas
router.get('/:customerId', [
  param('customerId').isInt({ min: 1 }).withMessage('customerId harus angka positif').toInt()
], customerController.getCustomerDetails);

// ✅ UPDATE/IMPUT NOMOR WA PELANGGAN
router.put('/:customerId/phone', [
  param('customerId').isInt({ min: 1 }).withMessage('customerId harus angka positif').toInt(),
  body('phone_number').isString().notEmpty().withMessage('Nomor WA wajib diisi').trim().escape()
], customerController.updatePhoneNumber);

module.exports = router;

