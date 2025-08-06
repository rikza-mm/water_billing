const express = require('express');
const router = express.Router();
const adminCustomerController = require('../../controllers/admin/transitionCustomersController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, body } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin'])); // HANYA ADMIN

// Endpoint khusus untuk migrasi pelanggan lama
// Dilindungi oleh middleware otentikasi dan otorisasi (isAdmin)
// POST /api/customers/migrate
router.post("/migrate", adminCustomerController.migrateCustomer);

// Endpoint untuk mentransisikan pelanggan
router.post('/transition', [
  body('customerId').isMongoId().withMessage('customerId harus valid'),
  body('fromAreaId').isMongoId().withMessage('fromAreaId harus valid'),
  body('toAreaId').isMongoId().withMessage('toAreaId harus valid'),
], adminCustomerController.transitionCustomer);

// Endpoint untuk mendapatkan transisi berdasarkan ID
router.get('/:id', [
  param('id').isMongoId().withMessage('id harus valid'),
], adminCustomerController.getTransitionById);

// Endpoint lain untuk customer bisa ditambahkan di sini...
// router.post("/", adminCustomerController.create);
// router.get("/", adminCustomerController.findAll);
// ...

module.exports = router;
