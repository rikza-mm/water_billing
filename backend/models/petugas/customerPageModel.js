const pool = require('../../config/db');

/**
 * [LOGIKA BARU] Mengambil semua pelanggan berdasarkan array ID area.
 * Fungsi ini secara eksklusif menggunakan view 'v_customer_history_summary' untuk efisiensi.
 *
 * @param {Array<number>} areaIds - Array yang berisi ID area yang diizinkan untuk petugas.
 * @returns {Promise<Array>} - Sebuah promise yang akan resolve dengan array objek pelanggan.
 */
const findCustomersByAreaIds = async (areaIds) => {
  // Pastikan view v_customer_history_summary sudah diperbarui di database Anda
  // untuk menyertakan semua kolom yang dibutuhkan (termasuk averageUsage jika perlu filter).
  const sql = `
    SELECT
      id, name, address, area, phoneNumber, status,
      saldo, hutang, meterNumber, category_name, lastReadingDate,
      lastPaymentDate, unpaidBills
    FROM
      v_customer_history_summary
    WHERE
      area_id IN (?)  -- Query sederhana menggunakan area_id dari view
    ORDER BY
      name ASC;
  `;

  try {
    // pool.query secara otomatis menangani array untuk klausa IN
    const [customers] = await pool.query(sql, [areaIds]);
    
    // Log untuk debugging di konsol server

    return customers;
  } catch (error) {
    // Lemparkan error agar bisa ditangkap oleh controller
    throw error;
  }
};

// Ekspor hanya fungsi baru yang akan kita gunakan.
module.exports = {
  findCustomersByAreaIds,
};