const express = require('express');
const router = express.Router();
const adminCustomerController = require('../../controllers/admin/customerController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, query, body } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin'])); // HANYA ADMIN

/**
 * @route   GET /api/v1/admin/customers
 * @desc    Mengambil semua pelanggan dengan filter, paginasi, dan statistik
 * @access  Private (Admin)
 */
router.get(
  '/',
  [
    query('search').optional().isString().trim().escape(),
    query('status').optional().isString().trim().escape(),
    query('area').optional().isString().trim().escape(),
    query('category').optional().isString().trim().escape(),
    query('arrears').optional().isString().trim().escape(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('perPage').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('sortBy').optional().isString().trim().escape(),
    query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order harus ASC atau DESC.')
  ],
  adminCustomerController.getCustomersAndStats
);

// Tambahkan rute ini di file yang sama
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID pelanggan harus berupa angka positif.').toInt()
  ],
  adminCustomerController.getCustomerDetails
);

// ✅ RUTE BARU UNTUK EDIT DATA (DIPERBAIKI)
router.patch(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID pelanggan harus berupa angka positif.').toInt(),
    body('full_name').optional().isString().trim().escape(),
    body('phone_number').optional().isString().trim().escape(),
    body('whatsapp_number').optional().isString().trim().escape(),
    body('address').optional().isString().trim().escape(),
    body('area_id').optional().isInt({ min: 1 }).toInt(),
    body('category_id').optional().isInt({ min: 1 }).toInt(),
    body('meter_number').optional().isString().trim().escape()
  ],
  adminCustomerController.updateCustomer
);

// ✅ RUTE BARU UNTUK UBAH STATUS
router.patch(
  '/:id/status',
  [
    param('id').isInt({ min: 1 }).withMessage('ID pelanggan harus berupa angka positif.').toInt(),
    body('status').isString().isIn(['active', 'inactive', 'suspended']).withMessage('Status tidak valid.').trim().escape()
  ],
  adminCustomerController.updateCustomerStatus
);

/**
 * @route   POST /api/v1/admin/customers
 * @desc    Menambah customer baru (admin)
 * @access  Private (Admin)
 */
router.post(
  '/',
  [
    body('full_name').isString().notEmpty().withMessage('Nama wajib diisi.').trim().escape(),
    body('area_id').isInt({ min: 1 }).withMessage('Area wajib diisi.').toInt(),
    body('category_id').optional().isInt({ min: 1 }).toInt(),
    body('meter_number').optional().isString().trim().escape(),
    body('phone_number').isString().notEmpty().withMessage('Nomor telepon wajib diisi.').trim().escape(),
    body('address').isString().notEmpty().withMessage('Alamat wajib diisi.').trim().escape(),
    body('status').optional().isIn(['active', 'inactive', 'suspended']).trim().escape(),
    body('registration_date').optional().isISO8601().toDate()
  ],
  adminCustomerController.createCustomer
);

/**
 * @route   GET /api/v1/admin/customers/categories/list
 * @desc    Mengambil daftar kategori pelanggan untuk dropdown
 * @access  Private (Admin)
 */
router.get('/categories/list', adminCustomerController.getCategories);

/**
 * @route   GET /api/v1/admin/customers/areas/list
 * @desc    Mengambil daftar area untuk dropdown
 * @access  Private (Admin)
 */
router.get('/areas/list', adminCustomerController.getAreas);

module.exports = router;