const express = require('express');
const AdminOfficerController = require('../../controllers/admin/officerController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, query, body } = require('express-validator');

const router = express.Router();

// Middleware untuk semua routes admin officer
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * @route GET /api/admin/officers/areas
 * @desc Get available areas for assignment
 */
router.get('/areas', AdminOfficerController.getAvailableAreas);

/**
 * @route GET /api/admin/officers
 * @desc Get all officers with enhanced filtering and metadata
 * @query search - Search by name, username, or phone number
 * @query status - Filter by officer status (active/inactive)
 * @query area_id - Filter by area ID
 * @query has_area - Filter officers with/without area assignment
 * @query available_for_assignment - Get officers available for assignment
 * @query page - Page number for pagination
 * @query limit - Items per page
 */
router.get(
  '/',
  [
    query('search').optional().isString().trim().escape(),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status harus active/inactive.'),
    query('area_id').optional().isInt({ min: 1 }).toInt(),
    query('has_area').optional().isBoolean().toBoolean(),
    query('available_for_assignment').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt()
  ],
  AdminOfficerController.getAllOfficers
);

/**
 * @route POST /api/admin/officers
 * @desc Create a new officer
 */
router.post(
  '/',
  [
    body('username').isString().notEmpty().trim().escape(),
    body('password').isString().notEmpty().trim(),
    body('full_name').isString().notEmpty().trim().escape(),
    body('phone_number').isString().notEmpty().trim().escape(),
    body('whatsapp_number').optional().isString().trim().escape(),
    body('salary').optional().isFloat({ min: 0 }).toFloat(),
    body('join_date').optional().isISO8601().toDate(),
    body('area_ids').optional().isArray()
  ],
  AdminOfficerController.createOfficer
);

/**
 * @route GET /api/admin/officers/:id
 * @desc Get officer by ID
 */
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
  ],
  AdminOfficerController.getOfficerById
);

/**
 * @route PUT /api/admin/officers/:id
 * @desc Update officer data
 */
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
    body('full_name').optional().isString().trim().escape(),
    body('phone_number').optional().isString().trim().escape(),
    body('whatsapp_number').optional().isString().trim().escape(),
    body('salary').optional().isFloat({ min: 0 }).toFloat(),
    body('area_ids').optional().isArray()
  ],
  AdminOfficerController.updateOfficer
);

/**
 * @route GET /api/admin/officers/:id/validate-deletion
 * @desc Validate if officer can be deleted
 */
router.get(
  '/:id/validate-deletion',
  [param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt()],
  AdminOfficerController.validateOfficerDeletion
);

/**
 * @route DELETE /api/admin/officers/:id
 * @desc Delete an officer (hard delete)
 */
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt()],
  AdminOfficerController.deleteOfficer
);

/**
 * @route PUT /api/admin/officers/:id/deactivate
 * @desc Deactivate officer (soft delete)
 */
router.put(
  '/:id/deactivate',
  [param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt()],
  AdminOfficerController.deactivateOfficer
);

/**
 * @route PUT /api/admin/officers/:id/reactivate
 * @desc Reactivate officer
 */
router.put(
  '/:id/reactivate',
  [param('id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt()],
  AdminOfficerController.reactivateOfficer
);

module.exports = router;