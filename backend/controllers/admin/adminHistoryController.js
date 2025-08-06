const AdminHistoryModel = require('../../models/admin/adminHistoryModel');
const pool = require('../../config/db');
const { validationResult } = require('express-validator');

const adminHistoryController = {
  async getCustomerHistory(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
    }
    try {
      const { customerId } = req.params;
      const historyData = await AdminHistoryModel.getCustomerHistory(customerId);

      if (!historyData) {
        return res.status(404).json({ success: false, message: 'Riwayat pelanggan tidak ditemukan.' });
      }

      res.status(200).json({ success: true, data: historyData });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pelanggan.' });
    }
  },

  async getPaymentDetails(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
    }
    try {
      const { paymentId } = req.params;
      const paymentDetails = await AdminHistoryModel.getPaymentDetails(paymentId);

      if (!paymentDetails) {
        return res.status(404).json({ success: false, message: 'Detail pembayaran tidak ditemukan.' });
      }

      res.status(200).json({ success: true, data: paymentDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil detail pembayaran.' });
    }
  },
  
  async searchAllCustomers(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
    }
    try {
      const { search } = req.query; // Ambil parameter 'search'
      let query = 'SELECT customer_id, full_name, saldo, hutang, meter_number, phone_number, address, area_name, status FROM v_admin_customer_list';
      const params = [];

      if (search && search.trim() !== '') {
        query += ` WHERE full_name LIKE ? OR meter_number LIKE ? OR phone_number LIKE ? OR customer_id = ?`;
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, search.trim());
      }
      
      query += ' ORDER BY full_name ASC LIMIT 50';

      const [customers] = await pool.query(query, params);
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil daftar pelanggan.' });
    }
  }
};

module.exports = adminHistoryController;