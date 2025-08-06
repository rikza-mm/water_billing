// ✅ Tambahkan ini di bagian paling atas file
const pool = require('../config/db');

class PaymentModel {
  // ✅ Buat pembayaran baru
  static async create(data) {
    const connection = await pool.getConnection();
    try {

      // ✅ Validasi data yang dibutuhkan
      const { bill_id, amount, method, user_id } = data;
      if (!bill_id) throw new Error('bill_id is required');
      if (!amount) throw new Error('amount is required');
      if (!user_id) throw new Error('user_id is required');
      if (!method) throw new Error('method is required');

      // ✅ Gunakan transaksi jika perlu update lebih dari 1 tabel nantinya
      await connection.beginTransaction();

      const [result] = await connection.execute(`
        INSERT INTO payments (
          bill_id,
          amount,
          method,
          transaction_date,
          status,
          user_id
        ) VALUES (?, ?, ?, NOW(), ?, ?)
      `, [bill_id, amount, method, 'completed', user_id]);

      await connection.commit();
      return result.insertId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ✅ Ambil detail pembayaran spesifik
  static async getPaymentDetails(paymentId) {
    const [rows] = await pool.execute(`
      SELECT
        p.*,
        b.customer_id,
        b.amount AS bill_amount,
        b.status AS bill_status,
        u.full_name AS user_name
      FROM payments p
      LEFT JOIN bills b ON b.bill_id = p.bill_id
      JOIN users u ON u.user_id = p.user_id
      WHERE p.payment_id = ?
    `, [paymentId]);

    return rows[0] || null;
  }

  // ✅ Ambil semua riwayat pembayaran customer tertentu
  static async getCustomerPayments(customerId) {
    const [rows] = await pool.execute(`
      SELECT
        p.*,
        b.amount AS bill_amount,
        b.status AS bill_status
      FROM payments p
      JOIN bills b ON b.bill_id = p.bill_id
      WHERE b.customer_id = ?
      ORDER BY p.transaction_date DESC
    `, [customerId]);

    return rows;
  }

  // ✅ Ambil semua pembayaran untuk tagihan tertentu
  static async getByBillId(billId) {
    const [rows] = await pool.execute(`
      SELECT
        p.*,
        u.full_name AS collector_name
      FROM payments p
      LEFT JOIN users u ON u.user_id = p.user_id
      WHERE p.bill_id = ?
      ORDER BY p.transaction_date DESC
    `, [billId]);

    return rows;
  }
}

module.exports = PaymentModel;
