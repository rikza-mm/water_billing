const pool = require('../config/db');

exports.getMonthlyBillingSummary = async (year, month) => {
  const [rows] = await pool.query(
    `SELECT * FROM monthly_billing_summary WHERE bulan = ?`,
    [`${year}-${month.toString().padStart(2, '0')}`]
  );
  return rows;
};

exports.exportToExcel = async (data) => {
  // Implementasi ekspor ke Excel menggunakan library seperti 'exceljs'
  // Contoh sederhana: mengembalikan data sebagai JSON untuk diproses frontend
  return data;
};