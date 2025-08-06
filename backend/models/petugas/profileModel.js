const pool = require('../../config/db');

/**
 * Mengambil data profil lengkap untuk seorang petugas berdasarkan ID-nya.
 * @param {number} userId - ID dari user petugas.
 * @returns {Promise<object|null>} - Mengembalikan objek profil atau null jika tidak ditemukan.
 */
const getProfileById = async (userId) => {
  const sql = `
    SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.phone_number,
        u.whatsapp_number,
        u.role,
        u.join_date,
        u.last_login,
        
        -- Menggabungkan semua nama area menjadi satu string, dipisahkan koma
        GROUP_CONCAT(a.area_name ORDER BY a.area_name SEPARATOR ', ') AS assigned_areas,
        
        -- Menghitung total pelanggan di semua area yang ditugaskan
        (SELECT COUNT(DISTINCT c.customer_id) 
         FROM customers c 
         WHERE c.area_id IN (SELECT oa.area_id FROM officer_areas oa WHERE oa.user_id = u.user_id)) AS total_customers_handled,
         
        -- Menghitung total pencatatan meter yang pernah dilakukan
        (SELECT COUNT(mr.reading_id) 
         FROM meter_readings mr 
         WHERE mr.user_id = u.user_id AND mr.deleted_at IS NULL) AS total_readings_made
         
    FROM
        users u
    LEFT JOIN
        officer_areas oa ON u.user_id = oa.user_id
    LEFT JOIN
        areas a ON oa.area_id = a.area_id
    WHERE
        u.user_id = ? AND u.role = 'petugas'
    GROUP BY
        u.user_id;
  `;

  try {
    const [rows] = await pool.query(sql, [userId]);
    if (rows.length > 0) {
      return rows[0]; // Kembalikan data profil jika ditemukan
    }
    return null; // Kembalikan null jika user tidak ditemukan atau bukan petugas
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getProfileById,
};