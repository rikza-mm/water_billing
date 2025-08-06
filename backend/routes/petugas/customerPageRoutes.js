//digunakan di frontend customerpage--------------------------------------

const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/petugas/customerPageController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { areaRestrictionMiddleware } = require('../../middleware/areaRestrictionMiddleware');
const { param } = require('express-validator');

/**
 * Rute ini secara spesifik untuk endpoint pengujian yang mengambil
 * semua pelanggan di area petugas menggunakan logika baru (customerPageModel).
 *
 * URL Lengkap: GET /api/v1/petugas/customers/my-area
 */
router.get(
  '/v1',
  [param('areaId').optional().isInt({ min: 1 }).toInt()],
  authMiddleware,                 // Cek token JWT
  roleMiddleware(['petugas']),      // Cek role adalah 'petugas'
  areaRestrictionMiddleware(),      // Dapatkan area yang diizinkan
  customerController.getMyAreaCustomers // Jalankan controller
);

module.exports = router;