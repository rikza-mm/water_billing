const { validationResult } = require('express-validator');
const AdminAreaModel = require('../../models/admin/areaModel');

class AdminAreaController {
  /**
   * Get all areas with filtering and pagination
   */
  static async getAreas(req, res) {
    try {
      const {
        search,
        has_officers,
        has_customers,
        postal_code,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        search,
        has_officers: has_officers !== undefined ? has_officers === 'true' : undefined,
        has_customers: has_customers !== undefined ? has_customers === 'true' : undefined,
        postal_code,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await AdminAreaModel.getAllAreasWithFilters(filters);
      const metadata = await AdminAreaModel.getAreaStatistics();

      res.status(200).json({
        success: true,
        data: result.data,
        metadata: {
          ...metadata,
          current_page: result.pagination.current_page,
          total_pages: result.pagination.total_pages,
          total_items: result.pagination.total_items
        },
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar area.",
        error: error.message
      });
    }
  }

  /**
   * Create new area
   */
  static async createArea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { area_name, postal_code } = req.body;

      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Nama area wajib diisi."
        });
      }

      const areaId = await AdminAreaModel.createArea({ area_name, postal_code });

      res.status(201).json({
        success: true,
        message: "Area berhasil dibuat.",
        data: { area_id: areaId }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat area.",
        error: error.message
      });
    }
  }

  /**
   * Update area
   */
  static async updateArea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { area_name, postal_code } = req.body;

      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Nama area wajib diisi."
        });
      }

      const updated = await AdminAreaModel.updateArea(id, { area_name, postal_code });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Area berhasil diperbarui.",
        data: { area_id: id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui area.",
        error: error.message
      });
    }
  }

  /**
   * Delete area
   */
  static async deleteArea(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;

      const deleted = await AdminAreaModel.deleteArea(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Area berhasil dihapus."
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
        message: "Terjadi kesalahan saat menghapus area.",
        error: error.message
      });
    }
  }

  /**
   * Get area details
   */
  static async getAreaDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await AdminAreaModel.getAreaDetails(id);

      if (!details) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil detail area.",
        error: error.message
      });
    }
  }

  /**
   * Get area statistics
   */
  static async getAreaStatistics(req, res) {
    try {
      const { id } = req.params;
      const { period } = req.query;

      // For now, return basic statistics
      // In production, you might want to implement period-based statistics
      const details = await AdminAreaModel.getAreaDetails(id);

      if (!details) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan."
        });
      }

      const statistics = {
        area_id: details.area_id,
        area_name: details.area_name,
        total_customers: details.total_customers,
        active_customers: details.active_customers,
        total_officers: details.total_officers,
        recent_activities_count: details.recent_activities.length,
        period: period || 'current_month',
        last_updated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik area.",
        error: error.message
      });
    }
  }

  /**
   * Export area data
   */
  static async exportAreaData(req, res) {
    try {
      const { format = 'excel' } = req.query;
      
      const areas = await AdminAreaModel.exportAreaData();
      
      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=area-data.json');
        res.status(200).json({
          success: true,
          data: areas,
          format: 'excel',
          exported_at: new Date().toISOString()
        });
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=area-data.json');
        res.status(200).json({
          success: true,
          data: areas,
          format: 'pdf',
          exported_at: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Format tidak didukung. Gunakan 'excel' atau 'pdf'."
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengekspor data area.",
        error: error.message
      });
    }
  }

  /**
   * Get area by ID
   */
  static async getAreaById(req, res) {
    try {
      const { id } = req.params;
      const area = await AdminAreaModel.getAreaDetails(id);

      if (!area) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        data: area
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil detail area.",
        error: error.message
      });
    }
  }
}

module.exports = AdminAreaController;