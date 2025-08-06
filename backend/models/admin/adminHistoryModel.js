const pool = require('../../config/db');

class AdminHistoryModel {
  /**
   * Mengambil seluruh riwayat gabungan & ringkasan untuk satu pelanggan.
   */
  static async getCustomerHistory(customerId) {
    const [results] = await pool.query('CALL GetAdminCustomerHistory(?)', [customerId]);
    
    const summary = results[0][0] || null;
    const billingHistoryRaw = results[1] || [];
    const debtHistoryRaw = results[2] || [];

    if (!summary) return null;
    
    // ✅ MODIFIKASI DI SINI: Parsing JSON dari hasil SP
    const billingHistory = billingHistoryRaw.map(bill => ({
      ...bill,
      petugas_pencatat: JSON.parse(bill.petugas_pencatat || '{}'),
      petugas_kasir: JSON.parse(bill.petugas_kasir || '{}')
    }));

    const debtHistory = debtHistoryRaw.map(debt => ({
      ...debt,
      petugas_kasir: JSON.parse(debt.petugas_kasir || '{}'),
      allocations: JSON.parse(debt.allocations || '[]') // Ini sudah ada, pastikan tetap ada
    }));

    // Kalkulasi tambahan (tidak berubah)
    const totalTagihan = billingHistory.reduce((sum, bill) => sum + parseFloat(bill.jumlah || 0), 0);
    const totalDibayar = billingHistory.reduce((sum, bill) => sum + parseFloat(bill.dibayar || 0), 0);
    const rataRataTagihan = billingHistory.length > 0 ? totalTagihan / billingHistory.length : 0;

    return {
      customerProfile: summary,
      financialSummary: {
        totalTagihan,
        totalDibayar,
        totalHutang: summary.hutang,
        rataRataTagihan
      },
      billingHistory, // Menggunakan hasil yang sudah di-parse
      debtHistory   // Menggunakan hasil yang sudah di-parse
    };
  }
  /**
   * Mengambil detail satu pembayaran spesifik.
   */
  static async getPaymentDetails(paymentId) {
    const [results] = await pool.query('CALL GetPaymentDetailsForAdmin(?)', [paymentId]);
    const result = results[0][0];

    if (!result) return null;

    return {
      payment_id: result.payment_id,
      transaction_date: result.transaction_date,
      method: result.method,
      amount: parseFloat(result.amount),
      balance_used: parseFloat(result.balance_used),
      total_payment_power: parseFloat(result.total_payment_power),
      proof_url: result.proof_url,
      officer: {
        user_id: result.officer_id,
        full_name: result.officer_name
      },
      customer: {
        customer_id: result.customer_id,
        full_name: result.customer_name
      },
      documents: JSON.parse(result.documents_json || '[]'),
      allocations: result.payment_type === 'debt' ? JSON.parse(result.allocations_json || '[]') : []
    };
  }
  /**
   * Mencari semua pelanggan dengan kondisi tertentu.
   */
  static async searchAllCustomers(searchTerm) {
    let sql = `
      SELECT 
        customer_id, full_name, saldo, hutang, meter_number, 
        phone_number, address, area_name, status 
      FROM v_admin_customer_list
    `;
    const params = [];
    if (searchTerm && searchTerm.trim() !== '') {
      sql += ` WHERE full_name LIKE ? OR meter_number LIKE ? OR phone_number LIKE ? OR customer_id = ?`;
      const likeTerm = `%${searchTerm.trim()}%`;
      params.push(likeTerm, likeTerm, likeTerm, searchTerm.trim());
    }
    sql += ' ORDER BY full_name ASC LIMIT 50';
    const [rows] = await pool.query(sql, params);
    return rows;
  }
}

module.exports = AdminHistoryModel;