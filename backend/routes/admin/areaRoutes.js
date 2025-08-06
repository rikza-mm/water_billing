const express = require('express');
const AdminAreaController = require('../../controllers/admin/areaController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, query, body } = require('express-validator');

const router = express.Router();

// Middleware untuk semua routes admin area
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * @route GET /api/admin/areas/export
 * @desc Export area data to Excel or PDF
 * @query format - Export format (excel/pdf)
 */
router.get(
  '/export',
  [
    query('format')
      .optional()
      .isString().withMessage('Format harus berupa string.')
      .isIn(['excel', 'pdf']).withMessage('Format tidak didukung.')
      .trim()
  ],
  AdminAreaController.exportAreaData
);

/**
 * @route GET /api/admin/areas
 * @desc Get all areas with enhanced filtering and metadata
 * @query search - Search by area name or postal code
 * @query has_officers - Filter areas with/without officers
 * @query has_customers - Filter areas with/without customers
 * @query postal_code - Filter by postal code
 * @query page - Page number for pagination
 * @query limit - Items per page
 */
router.get(
  '/',
  [
    query('search').optional().isString().trim().escape(),
    query('has_officers').optional().isBoolean().toBoolean(),
    query('has_customers').optional().isBoolean().toBoolean(),
    query('postal_code').optional().isString().trim().escape(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt()
  ],
  AdminAreaController.getAreas
);

/**
 * @route POST /api/admin/areas
 * @desc Create a new area
 */
router.post(
  '/',
  [
    body('area_name')
      .isString().withMessage('Nama area wajib diisi.')
      .notEmpty().withMessage('Nama area wajib diisi.')
      .trim().escape(),
    body('postal_code')
      .optional()
      .isString().withMessage('Kode pos harus berupa string.')
      .trim().escape()
  ],
  AdminAreaController.createArea
);

/**
 * @route GET /api/admin/areas/:id/details
 * @desc Get detailed area information including officers and customers
 */
router.get(
  '/:id/details',
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.')
      .toInt()
  ],
  AdminAreaController.getAreaDetails
);

/**
 * @route GET /api/admin/areas/:id/statistics
 * @desc Get area statistics for specific period
 * @query period - Time period for statistics
 */
router.get(
  '/:id/statistics',
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.')
      .toInt(),
    query('period').optional().isString().trim().escape()
  ],
  AdminAreaController.getAreaStatistics
);

/**
 * @route GET /api/admin/areas/:id
 * @desc Get area by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.')
      .toInt()
  ],
  AdminAreaController.getAreaById
);

/**
 * @route PUT /api/admin/areas/:id
 * @desc Update area data
 */
router.put(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.')
      .toInt(),
    body('area_name')
      .isString().withMessage('Nama area wajib diisi.')
      .notEmpty().withMessage('Nama area wajib diisi.')
      .trim().escape(),
    body('postal_code')
      .optional()
      .isString().withMessage('Kode pos harus berupa string.')
      .trim().escape()
  ],
  AdminAreaController.updateArea
);

/**
 * @route DELETE /api/admin/areas/:id
 * @desc Delete an area
 */
router.delete(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.')
      .toInt()
  ],
  AdminAreaController.deleteArea
);

module.exports = router;
