const pool = require('../config/db');

class BillModel {
  /**
   * Membuat tagihan baru
   */
  static async create(billData) {
    const [result] = await pool.execute(`
      INSERT INTO bills (
        customer_id, reading_id, rate_id, rate_per_cubic,
        period_start, period_end, due_date, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billData.customer_id,
      billData.reading_id,
      billData.rate_id,
      billData.rate_per_cubic,
      billData.period_start,
      billData.period_end,
      billData.due_date,
      billData.amount,
      billData.status
    ]);

    return result.insertId;
  }

  /**
   * Mengambil tarif air terbaru yang berlaku
   */
  static async getCurrentWaterRate() {
    const [rates] = await pool.execute(`
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
   * Mengambil detail tagihan berdasarkan ID
   */
  static async getBillDetails(billId) {
    const [rows] = await pool.execute(`
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
  static async getBillHistory(customerId) {
    const [rows] = await pool.execute(`
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
  static async update(billId, updateData) {
    const [result] = await pool.execute(`
      UPDATE bills
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE bill_id = ?
    `, [updateData.status, billId]);

    return result;
  }

  /**
   * Memperbarui tagihan (untuk admin)
   */
  static async updateBill(billId, data) {
    const connection = await pool.getConnection();
    try {
      const { amount, due_date, notes, status } = data;

      // Buat query update
      let query = 'UPDATE bills SET ';
      const params = [];
      const updates = [];

      if (amount !== undefined) {
        updates.push('amount = ?');
        params.push(amount);
      }

      if (due_date) {
        updates.push('due_date = ?');
        params.push(due_date);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes);
      }

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }

      // Tambahkan updated_at
      updates.push('updated_at = NOW()');

      query += updates.join(', ');
      query += ' WHERE bill_id = ?';
      params.push(billId);

      await connection.execute(query, params);

      // Dapatkan data yang diperbarui
      return await this.getBillDetails(billId);
    } finally {
      connection.release();
    }
  }

  /**
   * Mengambil total tagihan yang belum dibayar oleh pelanggan
   */
  static async getUnpaidBills(customerId) {
    const [rows] = await pool.execute(
      `SELECT SUM(amount) AS total_debt
       FROM bills
       WHERE customer_id = ? AND status != 'paid'`,
      [customerId]
    );
    return rows[0].total_debt || 0;
  }

  /**
   * Mengambil rata-rata pemakaian air 3 bulan terakhir
   */
  static async getAverageUsage(customerId) {
    const [rows] = await pool.execute(
      `SELECT AVG(current_reading - previous_reading) AS avg_usage
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC
       LIMIT 3`,
      [customerId]
    );
    return rows[0].avg_usage || 0;
  }

  /**
   * Mengajukan cicilan tagihan tertentu
   */
  static async applyInstallment(billId, amount) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [bills] = await connection.execute(
        'SELECT amount, installment_remaining FROM bills WHERE bill_id = ?',
        [billId]
      );

      if (!bills.length) throw new Error('Bill not found');

      const bill = bills[0];
      const newRemaining = bill.installment_remaining - amount;
      const status = newRemaining <= 0 ? 'paid' : 'partial';

      await connection.execute(
        'UPDATE bills SET installment_remaining = ?, status = ? WHERE bill_id = ?',
        [newRemaining, status, billId]
      );

      await connection.commit();
      return { newRemaining, status };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to apply installment: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Mengambil tagihan berdasarkan reading_id
   */
  static async getBillByReadingId(readingId) {
    const [rows] = await pool.execute(`
      SELECT * FROM bills
      WHERE reading_id = ?
      LIMIT 1
    `, [readingId]);
    return rows[0];
  }

  /**
   * Mengambil total nominal tagihan dari sekumpulan ID (belum lunas)
   */
  static async getTotalAmount(billIds) {
    const ids = Array.isArray(billIds) ? billIds : [billIds];
    const numericIds = ids.map(id => parseInt(id));
    const placeholders = numericIds.map(() => '?').join(',');

    const [result] = await pool.execute(`
      SELECT SUM(amount) as total_amount
      FROM bills
      WHERE bill_id IN (${placeholders})
      AND status != 'paid'
    `, numericIds);

    return result[0]?.total_amount || 0;
  }

  /**
   * Memperbarui status banyak tagihan sekaligus
   */
  static async updateStatus(billIds, status) {
    const ids = Array.isArray(billIds) ? billIds : [billIds];
    const numericIds = ids.map(id => parseInt(id));
    const placeholders = numericIds.map(() => '?').join(',');

    const [result] = await pool.execute(`
      UPDATE bills
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE bill_id IN (${placeholders})
    `, [status, ...numericIds]);

    return result.affectedRows > 0;
  }

  /**
   * Mengambil banyak tagihan berdasarkan array ID (belum lunas)
   */
  static async getBillsByIds(billIds) {
    const ids = Array.isArray(billIds) ? billIds : [billIds];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT * FROM bills WHERE bill_id IN (${placeholders}) AND status != 'paid'`,
      ids
    );
    return rows;
  }

  /**
   * Menghapus tagihan
   */
  static async deleteBill(billId) {
    const connection = await pool.getConnection();
    try {
      const query = 'DELETE FROM bills WHERE bill_id = ?';
      await connection.execute(query, [billId]);
      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * Mendapatkan laporan bulanan tagihan
   */
  static async getMonthlyReport(year, month, areaId = null) {
    const connection = await pool.getConnection();
    try {
      // Format tanggal
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0]; // Last day of month

      // Buat query
      let query = `
        SELECT
          a.area_name,
          COUNT(DISTINCT b.bill_id) AS total_bills,
          COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN b.bill_id END) AS paid_bills,
          COUNT(DISTINCT CASE WHEN b.status IN ('unpaid', 'partial', 'overdue') THEN b.bill_id END) AS unpaid_bills,
          SUM(b.amount) AS total_amount,
          SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END) AS paid_amount,
          SUM(CASE WHEN b.status IN ('unpaid', 'partial', 'overdue') THEN b.amount ELSE 0 END) AS unpaid_amount
        FROM bills b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN areas a ON c.area_id = a.area_id
        WHERE b.period_start >= ? AND b.period_end <= ?
      `;

      const params = [startDate, endDate];

      if (areaId) {
        query += ` AND c.area_id = ?`;
        params.push(areaId);
      }

      query += ` GROUP BY a.area_id, a.area_name`;

      const [rows] = await connection.execute(query, params);

      return rows.map(item => ({
        ...item,
        total_bills: parseInt(item.total_bills),
        paid_bills: parseInt(item.paid_bills),
        unpaid_bills: parseInt(item.unpaid_bills),
        total_amount: parseFloat(item.total_amount || 0),
        paid_amount: parseFloat(item.paid_amount || 0),
        unpaid_amount: parseFloat(item.unpaid_amount || 0)
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Mendapatkan tagihan yang tidak wajar (pemakaian melonjak)
   */
  static async getAbnormalBills(threshold = 3) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT
          b.bill_id,
          b.customer_id,
          c.full_name AS customer_name,
          c.meter_number,
          a.area_name,
          mr.previous_reading,
          mr.current_reading,
          mr.water_usage,
          b.period_start,
          b.period_end,
          b.amount,
          b.status,
          (
            SELECT AVG(mr_prev.water_usage)
            FROM meter_readings mr_prev
            WHERE mr_prev.customer_id = b.customer_id
            AND mr_prev.reading_date < mr.reading_date
            ORDER BY mr_prev.reading_date DESC
            LIMIT 3
          ) AS avg_previous_usage
        FROM bills b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN areas a ON c.area_id = a.area_id
        JOIN meter_readings mr ON b.reading_id = mr.reading_id
        WHERE mr.water_usage > (
          SELECT COALESCE(AVG(mr_prev.water_usage) * ?, 0)
          FROM meter_readings mr_prev
          WHERE mr_prev.customer_id = b.customer_id
          AND mr_prev.reading_date < mr.reading_date
          ORDER BY mr_prev.reading_date DESC
          LIMIT 3
        )
        AND mr.water_usage > 0
        ORDER BY b.period_end DESC
      `;

      const [rows] = await connection.execute(query, [threshold]);

      return rows.map(bill => ({
        ...bill,
        period_start: bill.period_start ? new Date(bill.period_start).toISOString().split('T')[0] : null,
        period_end: bill.period_end ? new Date(bill.period_end).toISOString().split('T')[0] : null,
        water_usage: parseFloat(bill.water_usage || 0),
        amount: parseFloat(bill.amount || 0),
        avg_previous_usage: parseFloat(bill.avg_previous_usage || 0),
        usage_increase_percent: bill.avg_previous_usage > 0
          ? Math.round((bill.water_usage / bill.avg_previous_usage - 1) * 100)
          : null
      }));
    } finally {
      connection.release();
    }
  }
}

module.exports = BillModel;
