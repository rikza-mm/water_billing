const { validationResult } = require('express-validator');
const AdminOfficerAreaModel = require('../../models/admin/officerAreaModel');

class AdminOfficerAreaController {
  /**
   * Assign officer to area
   */
  static async assignOfficerToArea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { user_id, area_id } = req.body;

      if (!user_id || !area_id) {
        return res.status(400).json({
          success: false,
          message: "User ID dan Area ID wajib diisi."
        });
      }

      const assignmentId = await AdminOfficerAreaModel.assignOfficerToArea(
        user_id,
        area_id
      );

      res.status(201).json({
        success: true,
        message: "Petugas berhasil ditugaskan ke area.",
        data: { assignment_id: assignmentId }
      });
    } catch (error) {

      if (error.message.includes('sudah ditugaskan') ||
          error.message.includes('tidak ditemukan') ||
          error.message.includes('tidak aktif')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menugaskan petugas.",
        error: error.message
      });
    }
  }

  /**
   * Unassign officer from area
   */
  static async unassignOfficerFromArea(req, res) {
    try {
      const { userId, areaId } = req.params;

      const unassigned = await AdminOfficerAreaModel.unassignOfficerFromArea(
        parseInt(userId),
        parseInt(areaId)
      );

      if (!unassigned) {
        return res.status(404).json({
          success: false,
          message: "Penugasan tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Penugasan petugas berhasil dibatalkan."
      });
    } catch (error) {

      if (error.message.includes('pelanggan')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membatalkan penugasan.",
        error: error.message
      });
    }
  }

  /**
   * Transfer officer from one area to another
   */
  static async transferOfficerArea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { user_id, from_area_id, to_area_id } = req.body;

      if (!user_id || !from_area_id || !to_area_id) {
        return res.status(400).json({
          success: false,
          message: "User ID, Area asal, dan Area tujuan wajib diisi."
        });
      }

      if (from_area_id === to_area_id) {
        return res.status(400).json({
          success: false,
          message: "Area asal dan tujuan tidak boleh sama."
        });
      }

      const transferred = await AdminOfficerAreaModel.transferOfficerArea(
        user_id,
        from_area_id,
        to_area_id
      );

      res.status(200).json({
        success: true,
        message: "Petugas berhasil dipindahkan ke area baru.",
        data: { transferred }
      });
    } catch (error) {

      if (error.message.includes('tidak ditugaskan') ||
          error.message.includes('tidak ditemukan') ||
          error.message.includes('sudah ditugaskan')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memindahkan petugas.",
        error: error.message
      });
    }
  }

  /**
   * Bulk assign officers to areas
   */
  static async bulkAssignOfficers(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { assignments } = req.body;

      if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Daftar penugasan wajib diisi dan harus berupa array."
        });
      }

      const results = await AdminOfficerAreaModel.bulkAssignOfficers(assignments);

      const successCount = results.filter(r => r.status === 'assigned').length;
      const alreadyAssignedCount = results.filter(r => r.status === 'already_assigned').length;

      res.status(200).json({
        success: true,
        message: `Penugasan massal selesai. ${successCount} berhasil, ${alreadyAssignedCount} sudah ditugaskan.`,
        data: {
          results,
          summary: {
            total: results.length,
            assigned: successCount,
            already_assigned: alreadyAssignedCount
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat melakukan penugasan massal.",
        error: error.message
      });
    }
  }

  /**
   * Get all officer-area assignments
   */
  static async getAllAssignments(req, res) {
    try {
      const { officer_id, area_id, active_only } = req.query;

      const filters = {
        officer_id: officer_id ? parseInt(officer_id) : undefined,
        area_id: area_id ? parseInt(area_id) : undefined,
        active_only: active_only === 'true'
      };

      const assignments = await AdminOfficerAreaModel.getAllAssignments(filters);
      const statistics = await AdminOfficerAreaModel.getAssignmentStatistics();

      res.status(200).json({
        success: true,
        data: assignments,
        metadata: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar penugasan.",
        error: error.message
      });
    }
  }

  /**
   * Get areas assigned to specific officer
   */
  static async getOfficerAreas(req, res) {
    try {
      const { userId } = req.params;
      const areas = await AdminOfficerAreaModel.getOfficerAreas(parseInt(userId));

      res.status(200).json({
        success: true,
        data: areas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil area petugas.",
        error: error.message
      });
    }
  }

  /**
   * Get officers assigned to specific area
   */
  static async getAreaOfficers(req, res) {
    try {
      const { areaId } = req.params;
      const officers = await AdminOfficerAreaModel.getAreaOfficers(parseInt(areaId));

      res.status(200).json({
        success: true,
        data: officers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil petugas area.",
        error: error.message
      });
    }
  }

  /**
   * Get unassigned officers
   */
  static async getUnassignedOfficers(req, res) {
    try {
      const officers = await AdminOfficerAreaModel.getUnassignedOfficers();

      res.status(200).json({
        success: true,
        data: officers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil petugas yang belum ditugaskan.",
        error: error.message
      });
    }
  }

  /**
   * Get areas without officers
   */
  static async getAreasWithoutOfficers(req, res) {
    try {
      const areas = await AdminOfficerAreaModel.getAreasWithoutOfficers();

      res.status(200).json({
        success: true,
        data: areas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil area tanpa petugas.",
        error: error.message
      });
    }
  }
}

module.exports = AdminOfficerAreaController;