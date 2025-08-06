const express = require('express');
const AdminOfficerAreaController = require('../../controllers/admin/officerAreaController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { param, body } = require('express-validator');

const router = express.Router();

// Middleware untuk semua routes admin officer-area
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * @route GET /api/admin/officer-areas/unassigned-officers
 * @desc Get officers that are not assigned to any area
 */
router.get('/unassigned-officers', AdminOfficerAreaController.getUnassignedOfficers);

/**
 * @route GET /api/admin/officer-areas/areas-without-officers
 * @desc Get areas that don't have any officers assigned
 */
router.get('/areas-without-officers', AdminOfficerAreaController.getAreasWithoutOfficers);

/**
 * @route POST /api/admin/officer-areas/assign
 * @desc Assign officer to area
 * @body user_id - Officer user ID
 * @body area_id - Area ID
 * @body assigned_date - Assignment date (optional)
 */
router.post(
  '/assign',
  [
    body('user_id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
    body('area_id').isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.').toInt(),
    body('assigned_date').optional().isISO8601().withMessage('Tanggal penugasan harus format ISO8601.')
  ],
  AdminOfficerAreaController.assignOfficerToArea
);

/**
 * @route POST /api/admin/officer-areas/transfer
 * @desc Transfer officer from one area to another
 * @body user_id - Officer user ID
 * @body from_area_id - Source area ID
 * @body to_area_id - Destination area ID
 */
router.post(
  '/transfer',
  [
    body('user_id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
    body('from_area_id').isInt({ min: 1 }).withMessage('ID area asal harus berupa angka positif.').toInt(),
    body('to_area_id').isInt({ min: 1 }).withMessage('ID area tujuan harus berupa angka positif.').toInt()
  ],
  AdminOfficerAreaController.transferOfficerArea
);

/**
 * @route POST /api/admin/officer-areas/bulk-assign
 * @desc Bulk assign officers to areas
 * @body assignments - Array of {user_id, area_id} objects
 */
router.post(
  '/bulk-assign',
  [
    body('assignments').isArray({ min: 1 }).withMessage('Assignments harus berupa array minimal 1 data.'),
    body('assignments.*.user_id').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
    body('assignments.*.area_id').isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.').toInt()
  ],
  AdminOfficerAreaController.bulkAssignOfficers
);

/**
 * @route GET /api/admin/officer-areas
 * @desc Get all officer-area assignments
 */
router.get('/', AdminOfficerAreaController.getAllAssignments);

/**
 * @route GET /api/admin/officer-areas/officer/:userId
 * @desc Get all areas assigned to specific officer
 * @param userId - Officer user ID
 */
router.get(
  '/officer/:userId',
  [param('userId').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt()],
  AdminOfficerAreaController.getOfficerAreas
);

/**
 * @route GET /api/admin/officer-areas/area/:areaId
 * @desc Get all officers assigned to specific area
 * @param areaId - Area ID
 */
router.get(
  '/area/:areaId',
  [param('areaId').isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.').toInt()],
  AdminOfficerAreaController.getAreaOfficers
);

/**
 * @route DELETE /api/admin/officer-areas/:userId/:areaId
 * @desc Unassign officer from area
 * @param userId - Officer user ID
 * @param areaId - Area ID
 */
router.delete(
  '/:userId/:areaId',
  [
    param('userId').isInt({ min: 1 }).withMessage('ID petugas harus berupa angka positif.').toInt(),
    param('areaId').isInt({ min: 1 }).withMessage('ID area harus berupa angka positif.').toInt()
  ],
  AdminOfficerAreaController.unassignOfficerFromArea
);

module.exports = router;
