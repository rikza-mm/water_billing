const express = require('express');
const router = express.Router();
const WaterUsageController = require('../../controllers/admin/waterUsageController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, body } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Definisikan endpoint untuk mengambil semua data analisis pemakaian air
router.post('/', WaterUsageController.getWaterUsageData);
router.post('/record', [
  body('customerId').isMongoId().withMessage('customerId harus valid'),
  body('usage').isNumeric().withMessage('usage harus angka'),
  body('period').isString().notEmpty().withMessage('period wajib diisi'),
], WaterUsageController.recordUsage);

router.get('/:id', [
  param('id').isMongoId().withMessage('id harus valid'),
], WaterUsageController.getUsageById);

module.exports = router;
