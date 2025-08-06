const { validationResult } = require('express-validator');
const AdminOfficerModel = require('../../models/admin/officerModel');

class AdminOfficerController {
  /**
   * Get all officers with filtering and pagination
   */
  static async getAllOfficers(req, res) {
    try {
      const {
        search,
        status,
        area_id,
        has_area,
        available_for_assignment,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        search,
        status,
        area_id: area_id ? parseInt(area_id) : undefined,
        has_area: has_area !== undefined ? has_area === 'true' : undefined,
        available_for_assignment: available_for_assignment === 'true',
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await AdminOfficerModel.getAllOfficersWithFilters(filters);
      const metadata = await AdminOfficerModel.getOfficerStatistics();

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
        message: "Gagal mengambil daftar petugas.",
        error: error.message
      });
    }
  }

  /**
   * Create new officer
   */
  static async createOfficer(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        username,
        password,
        full_name,
        phone_number,
        whatsapp_number,
        salary,
        join_date,
        area_ids
      } = req.body;

      // Validation
      if (!username || !password || !full_name || !phone_number) {
        return res.status(400).json({
          success: false,
          message: "Username, password, nama lengkap, dan nomor telepon wajib diisi."
        });
      }

      const officerId = await AdminOfficerModel.createOfficer({
        username,
        password,
        full_name,
        phone_number,
        whatsapp_number,
        salary,
        join_date,
        area_ids
      });

      res.status(201).json({
        success: true,
        message: "Petugas berhasil dibuat.",
        data: { officer_id: officerId }
      });
    } catch (error) {

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: "Username sudah digunakan."
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membuat petugas.",
        error: error.message
      });
    }
  }

  /**
   * Update officer
   */
  static async updateOfficer(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const updateData = req.body;

      function toMySQLDate(dateString) {
        if (!dateString) return null;
        // Jika sudah format YYYY-MM-DD, return langsung
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        // Jika ISO string, ambil bagian tanggal saja
        return new Date(dateString).toISOString().slice(0, 10);
      }

      // Saat update:
      if (updateData.join_date) {
        updateData.join_date = toMySQLDate(updateData.join_date);
      }

      const updated = await AdminOfficerModel.updateOfficer(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Petugas tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Petugas berhasil diperbarui.",
        data: { officer_id: id }
      });
    } catch (error) {

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: "Username sudah digunakan."
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui petugas.",
        error: error.message
      });
    }
  }

  /**
   * Validate officer deletion
   */
  static async validateOfficerDeletion(req, res) {
    try {
      const { id } = req.params;

      const validation = await AdminOfficerModel.validateOfficerDeletion(id);

      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal memvalidasi penghapusan petugas.",
        error: error.message
      });
    }
  }

  /**
   * Delete officer
   */
  static async deleteOfficer(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;

      // ā… PERBAIKAN: Validasi terlebih dahulu sebelum menghapus
      const validation = await AdminOfficerModel.validateOfficerDeletion(id);

      if (!validation.canDelete) {
        return res.status(400).json({
          success: false,
          message: "Tidak dapat menghapus petugas.",
          reasons: validation.reasons,
          details: validation.details,
          suggestions: [
            "Hapus penugasan area petugas terlebih dahulu",
            "Pindahkan tanggung jawab pelanggan ke petugas lain",
            "Atau nonaktifkan petugas alih-alih menghapus untuk mempertahankan data historis"
          ]
        });
      }

      const deleted = await AdminOfficerModel.deleteOfficer(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Petugas tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Petugas berhasil dihapus."
      });
    } catch (error) {

      // ā… PERBAIKAN: Handle berbagai jenis error dengan lebih spesifik
      if (error.message.includes('bertanggung jawab atas')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          type: 'CUSTOMER_DEPENDENCY'
        });
      }

      if (error.message.includes('riwayat')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          type: 'HISTORICAL_DATA'
        });
      }

      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          success: false,
          message: "Tidak dapat menghapus petugas karena masih memiliki data terkait. Gunakan fitur nonaktifkan petugas sebagai gantinya.",
          type: 'FOREIGN_KEY_CONSTRAINT'
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghapus petugas.",
        error: error.message
      });
    }
  }

  /**
   * Get officer by ID
   */
  static async getOfficerById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const officer = await AdminOfficerModel.getOfficerById(id);

      if (!officer) {
        return res.status(404).json({
          success: false,
          message: "Petugas tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        data: officer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil detail petugas.",
        error: error.message
      });
    }
  }

  /**
   * Get available areas for assignment
   */
  static async getAvailableAreas(req, res) {
    try {
      const areas = await AdminOfficerModel.getAvailableAreas();

      res.status(200).json({
        success: true,
        data: areas
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
   * Deactivate officer (soft delete)
   */
  static async deactivateOfficer(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const deactivated = await AdminOfficerModel.deactivateOfficer(id, reason);

      if (!deactivated) {
        return res.status(404).json({
          success: false,
          message: "Petugas tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Petugas berhasil dinonaktifkan. Data historis tetap dipertahankan."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menonaktifkan petugas.",
        error: error.message
      });
    }
  }

  /**
   * Reactivate officer
   */
  static async reactivateOfficer(req, res) {
    try {
      const { id } = req.params;

      const reactivated = await AdminOfficerModel.reactivateOfficer(id);

      if (!reactivated) {
        return res.status(404).json({
          success: false,
          message: "Petugas tidak ditemukan."
        });
      }

      res.status(200).json({
        success: true,
        message: "Petugas berhasil diaktifkan kembali."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengaktifkan petugas.",
        error: error.message
      });
    }
  }
}

module.exports = AdminOfficerController;