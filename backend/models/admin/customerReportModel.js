const pool = require('../../config/db');

class CustomerReportModel {
  static async getCustomerAnalytics() {
    const connection = await pool.getConnection();
    try {
      // Menggunakan Promise.all untuk menjalankan semua query analitik secara paralel
      const [
        [summary],
        customersWithDebt,
        customersWithBalance,
        unbilledCustomers,
        overdueCustomers
      ] = await Promise.all([
        // Query 1: Ringkasan Umum
        connection.query(`
          SELECT
            COUNT(customer_id) AS total_active_customers,
            COALESCE(SUM(hutang), 0) AS total_debt,
            COALESCE(SUM(saldo), 0) AS total_balance
          FROM customers WHERE status = 'active'
        `),
        // Query 2: Daftar pelanggan dengan hutang
        connection.query(`
          SELECT c.customer_id, c.full_name, c.hutang, a.area_name
          FROM customers c
          JOIN areas a ON c.area_id = a.area_id
          WHERE c.hutang > 0 AND c.status = 'active'
          ORDER BY c.hutang DESC
        `),
        // Query 3: Daftar pelanggan dengan saldo
        connection.query(`
          SELECT c.customer_id, c.full_name, c.saldo, a.area_name
          FROM customers c
          JOIN areas a ON c.area_id = a.area_id
          WHERE c.saldo > 0 AND c.status = 'active'
          ORDER BY c.saldo DESC
        `),
        // Query 4: Daftar pelanggan yang belum ditagih > 2 bulan
        connection.query(`
          SELECT c.customer_id, c.full_name, a.area_name,
            (SELECT MAX(mr.reading_date) FROM meter_readings mr WHERE mr.customer_id = c.customer_id) as last_reading_date
          FROM customers c
          JOIN areas a ON c.area_id = a.area_id
          WHERE c.status = 'active' AND (
            (SELECT MAX(mr.reading_date) FROM meter_readings mr WHERE mr.customer_id = c.customer_id) IS NULL OR
            (SELECT MAX(mr.reading_date) FROM meter_readings mr WHERE mr.customer_id = c.customer_id) < DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
          )
        `),
        // Query 5: Daftar pelanggan menunggak > 3 bulan
        connection.query(`
          SELECT DISTINCT c.customer_id, c.full_name, a.area_name, c.hutang
          FROM customers c
          JOIN bills b ON c.customer_id = b.customer_id
          JOIN areas a ON c.area_id = a.area_id
          WHERE b.status IN ('unpaid', 'partial', 'overdue')
            AND b.due_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            AND c.status = 'active'
        `)
      ]);

      return {
        summary: summary[0],
        customersWithDebt,
        customersWithBalance,
        unbilledCustomers,
        overdueCustomers
      };
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = CustomerReportModel;