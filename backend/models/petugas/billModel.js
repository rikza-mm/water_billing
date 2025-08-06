const pool = require('../../config/db');

class BillModel {

  static async findById(billId, connection) {
    const conn = connection || pool;
    const [rows] = await conn.query('SELECT * FROM bills WHERE bill_id = ?', [billId]);
    return rows[0] || null;
  }
  /**
   * Membuat tagihan baru
   */
  static async create(billData, connection) {
    const conn = connection || pool;
    
    // Pastikan semua nilai ada dan tidak undefined
    const safeData = {
      customer_id: billData.customer_id || null,
      reading_id: billData.reading_id || null,
      rate_id: billData.rate_id || null,
      rate_per_cubic: billData.rate_per_cubic || 4000.00, // Default rate
      period_start: billData.period_start || null,
      period_end: billData.period_end || null,
      due_date: billData.due_date || null,
      amount: billData.amount || 0,
      status: billData.status || 'unpaid',
      notes: billData.notes || null
    };
    
    // Validasi data penting
    if (!safeData.customer_id) throw new Error('customer_id is required');
    if (!safeData.reading_id) throw new Error('reading_id is required');
    if (!safeData.rate_id) throw new Error('rate_id is required');
    if (!safeData.period_start) throw new Error('period_start is required');
    if (!safeData.period_end) throw new Error('period_end is required');
    if (!safeData.due_date) throw new Error('due_date is required');
    
    const [result] = await conn.execute(`
      INSERT INTO bills (
        customer_id, reading_id, rate_id, rate_per_cubic,
        period_start, period_end, due_date, amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      safeData.customer_id,
      safeData.reading_id,
      safeData.rate_id,
      safeData.rate_per_cubic,
      safeData.period_start,
      safeData.period_end,
      safeData.due_date,
      safeData.amount,
      safeData.status,
      safeData.notes
    ]);

    return result.insertId;
  }

  /**
   * Mengambil detail tagihan berdasarkan ID
   */
  static async getBillDetails(billId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(`
      SELECT b.*, c.full_name AS customer_name,
             mr.previous_reading, mr.current_reading,
             (mr.current_reading - mr.previous_reading) AS water_usage,
             DATE_FORMAT(b.period_start, '%Y-%m-%d') AS period_start,
             DATE_FORMAT(b.period_end, '%Y-%m-%d') AS period_end,
             DATE_FORMAT(b.due_date, '%Y-%m-%d') AS due_date
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.customer_id
      LEFT JOIN meter_readings mr ON b.reading_id = mr.reading_id
      WHERE b.bill_id = ?
    `, [billId]);

    return rows[0] || null;
  }

  /**
   * Mengambil histori tagihan pelanggan berdasarkan customer_id
   */
  static async getBillHistory(customerId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(`
      SELECT b.*, 
             mr.previous_reading, mr.current_reading,
             (mr.current_reading - mr.previous_reading) AS water_usage,
             DATE_FORMAT(b.period_start, '%Y-%m-%d') AS period_start,
             DATE_FORMAT(b.period_end, '%Y-%m-%d') AS period_end,
             DATE_FORMAT(b.due_date, '%Y-%m-%d') AS due_date
      FROM bills b
      LEFT JOIN meter_readings mr ON b.reading_id = mr.reading_id
      WHERE b.customer_id = ?
      ORDER BY b.period_start DESC
    `, [customerId]);

    return rows;
  }

  /**
   * Memperbarui status tagihan
   */
  static async update(billId, updateData, connection) {
    const conn = connection || pool;
    
    const fields = [];
    const values = [];
    
    // Buat query dinamis berdasarkan field yang diupdate
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    // Tambahkan updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Tambahkan bill_id ke values
    values.push(billId);
    
    const [result] = await conn.execute(`
      UPDATE bills 
      SET ${fields.join(', ')}
      WHERE bill_id = ?
    `, values);

    return result.affectedRows > 0;
  }

  /**
   * Mengambil total tagihan yang belum dibayar oleh pelanggan
   */
  static async getUnpaidBills(customerId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(
      `SELECT SUM(amount) AS total_debt 
       FROM bills 
       WHERE customer_id = ? AND status != 'paid'`,
      [customerId]
    );
    return rows[0].total_debt || 0;
  }

  /**
   * Mengambil tagihan berdasarkan reading_id
   */
  static async getBillByReadingId(readingId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(`
      SELECT * FROM bills 
      WHERE reading_id = ?
      LIMIT 1
    `, [readingId]);
    return rows[0];
  }

  /**
   * Mengambil tarif air terbaru yang berlaku
   */
  static async getCurrentWaterRate(connection) {
    const conn = connection || pool;
    
    const [rates] = await conn.execute(`
      SELECT rate_id, rate_per_cubic, minimum_usage
      FROM water_rates 
      WHERE effective_date <= CURDATE() 
      ORDER BY effective_date DESC 
      LIMIT 1
    `);
    if (!rates.length) throw new Error('No water rate found');
    return rates[0];
  }

  /**
   * Mengambil tagihan yang jatuh tempo
   */
  static async getOverdueBills(connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(`
      SELECT b.*, c.full_name AS customer_name,
             DATE_FORMAT(b.due_date, '%Y-%m-%d') AS due_date
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      WHERE b.due_date < CURDATE() AND b.status IN ('unpaid', 'partial')
      ORDER BY b.due_date ASC
    `);
    
    return rows;
  }

  /**
   * Mengambil ringkasan tagihan bulanan
   */
  static async getMonthlyBillingSummary(year, month, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(`
      SELECT 
        DATE_FORMAT(b.period_start, '%Y-%m') AS month,
        COUNT(b.bill_id) AS total_bills,
        SUM(b.amount) AS total_amount,
        SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END) AS paid_amount,
        SUM(CASE WHEN b.status != 'paid' THEN b.amount ELSE 0 END) AS unpaid_amount,
        COUNT(CASE WHEN b.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN b.status != 'paid' THEN 1 END) AS unpaid_count
      FROM bills b
      WHERE YEAR(b.period_start) = ? AND MONTH(b.period_start) = ?
      GROUP BY DATE_FORMAT(b.period_start, '%Y-%m')
    `, [year, month]);
    
    return rows[0] || {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      total_bills: 0,
      total_amount: 0,
      paid_amount: 0,
      unpaid_amount: 0,
      paid_count: 0,
      unpaid_count: 0
    };
  }
}

module.exports = BillModel;