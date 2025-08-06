const pool = require('../../config/db');

class AdminOfficerAreaModel {
  /**
   * Assign officer to area
   */
  static async assignOfficerToArea(userId, areaId) {
    // Check if assignment already exists
    const [existing] = await pool.execute(
      'SELECT * FROM officer_areas WHERE user_id = ? AND area_id = ?',
      [userId, areaId]
    );

    if (existing.length > 0) {
      throw new Error('Petugas sudah ditugaskan ke area ini');
    }

    // Check if officer exists and is active
    const [officer] = await pool.execute(
      'SELECT * FROM users WHERE user_id = ? AND role = "petugas" AND is_active = 1',
      [userId]
    );

    if (officer.length === 0) {
      throw new Error('Petugas tidak ditemukan atau tidak aktif');
    }

    // Check if area exists
    const [area] = await pool.execute(
      'SELECT * FROM areas WHERE area_id = ?',
      [areaId]
    );

    if (area.length === 0) {
      throw new Error('Area tidak ditemukan');
    }

    // Create assignment
    const [result] = await pool.execute(
      'INSERT INTO officer_areas (user_id, area_id) VALUES (?, ?)',
      [userId, areaId]
    );

    return result.insertId;
  }

  /**
   * Unassign officer from area
   */
  static async unassignOfficerFromArea(userId, areaId) {
    // Check if officer has customers in this area
    const [customers] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE area_id = ?',
      [areaId]
    );

    if (customers[0].count > 0) {
      throw new Error('Tidak dapat membatalkan penugasan petugas yang masih memiliki pelanggan di area ini');
    }

    const [result] = await pool.execute(
      'DELETE FROM officer_areas WHERE user_id = ? AND area_id = ?',
      [userId, areaId]
    );

    return result.affectedRows > 0;
  }

      /**
     * [DIPERBAIKI] Memindahkan penugasan seorang petugas dari satu area ke area lain.
     * Logika UPDATE customers yang salah telah dihapus.
     */
      static async transferOfficerArea(userId, fromAreaId, toAreaId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Validasi untuk memastikan penugasan lama ada
            const [deleteResult] = await connection.execute(
                'DELETE FROM officer_areas WHERE user_id = ? AND area_id = ?',
                [userId, fromAreaId]
            );

            if (deleteResult.affectedRows === 0) {
                // Jika tidak ada yang dihapus, berarti penugasan lama tidak ada. Batalkan.
                throw new Error('Penugasan lama untuk petugas di area asal tidak ditemukan.');
            }

            // Buat penugasan baru
            await connection.execute(
                'INSERT INTO officer_areas (user_id, area_id) VALUES (?, ?)',
                [userId, toAreaId]
            );
            
            // ❌ Perintah UPDATE customers YANG SALAH DIHAPUS DARI SINI

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error; // Lemparkan error agar bisa ditangani controller
        } finally {
            connection.release();
        }
    }

  /**
   * Bulk assign officers to areas
   */
  static async bulkAssignOfficers(assignments) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const results = [];

      for (const assignment of assignments) {
        const { user_id, area_id } = assignment;

        // Check if assignment already exists
        const [existing] = await connection.execute(
          'SELECT * FROM officer_areas WHERE user_id = ? AND area_id = ?',
          [user_id, area_id]
        );

        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO officer_areas (user_id, area_id) VALUES (?, ?)',
            [user_id, area_id]
          );
          results.push({ user_id, area_id, status: 'assigned' });
        } else {
          results.push({ user_id, area_id, status: 'already_assigned' });
        }
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all officer-area assignments
   */
  static async getAllAssignments(filters = {}) {
    let query = `
      SELECT
        oa.user_id,
        oa.area_id,
        u.full_name as officer_name,
        u.username,
        u.phone_number,
        u.is_active as officer_active,
        a.area_name,
        a.postal_code,
        COUNT(DISTINCT c.customer_id) as total_customers
      FROM officer_areas oa
      JOIN users u ON u.user_id = oa.user_id
      JOIN areas a ON a.area_id = oa.area_id
      LEFT JOIN customers c ON c.area_id = oa.area_id
      WHERE u.role = 'petugas'
    `;

    const conditions = [];
    const params = [];

    if (filters.officer_id) {
      conditions.push('oa.user_id = ?');
      params.push(filters.officer_id);
    }

    if (filters.area_id) {
      conditions.push('oa.area_id = ?');
      params.push(filters.area_id);
    }

    if (filters.active_only) {
      conditions.push('u.is_active = 1');
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' GROUP BY oa.user_id, oa.area_id ORDER BY u.full_name ASC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Get areas assigned to specific officer
   */
  static async getOfficerAreas(userId) {
    const [rows] = await pool.execute(`
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.customer_id END) as active_customers
      FROM officer_areas oa
      JOIN areas a ON a.area_id = oa.area_id
      LEFT JOIN customers c ON c.area_id = oa.area_id
      WHERE oa.user_id = ?
      GROUP BY a.area_id
      ORDER BY a.area_name ASC
    `, [userId]);

    return rows;
  }

  /**
   * Get officers assigned to specific area
   */
  static async getAreaOfficers(areaId) {
    const [rows] = await pool.execute(`
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.phone_number,
        u.whatsapp_number,
        u.is_active,
        u.salary,
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.customer_id END) as active_customers
      FROM officer_areas oa
      JOIN users u ON u.user_id = oa.user_id
      LEFT JOIN customers c ON c.area_id = oa.area_id
      WHERE oa.area_id = ? AND u.role = 'petugas'
      GROUP BY u.user_id
      ORDER BY u.full_name ASC
    `, [areaId]);

    return rows;
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStatistics() {
    const [stats] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'petugas' AND is_active = 1) as total_officers,
        (SELECT COUNT(DISTINCT oa.user_id) FROM officer_areas oa JOIN users u ON oa.user_id = u.user_id WHERE u.role = 'petugas' AND u.is_active = 1) as assigned_officers,
        (SELECT COUNT(*) FROM areas) as total_areas,
        (SELECT COUNT(DISTINCT oa.area_id) FROM officer_areas oa) as areas_with_officers,
        (SELECT COUNT(*) FROM officer_areas) as total_assignments
    `);

    return stats[0] || {};
  }

  /**
   * Get unassigned officers
   */
  static async getUnassignedOfficers() {
    const [rows] = await pool.execute(`
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.phone_number,
        u.whatsapp_number,
        u.is_active,
        u.salary
      FROM users u
      LEFT JOIN officer_areas oa ON u.user_id = oa.user_id
      WHERE u.role = 'petugas'
        AND u.is_active = 1
        AND oa.user_id IS NULL
      ORDER BY u.full_name ASC
    `);

    return rows;
  }

  /**
   * Get areas without officers
   */
  static async getAreasWithoutOfficers() {
    const [rows] = await pool.execute(`
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        COUNT(DISTINCT c.customer_id) as total_customers
      FROM areas a
      LEFT JOIN officer_areas oa ON a.area_id = oa.area_id
      LEFT JOIN customers c ON c.area_id = a.area_id
      WHERE oa.area_id IS NULL
      GROUP BY a.area_id
      ORDER BY a.area_name ASC
    `);

    return rows;
  }
}

module.exports = AdminOfficerAreaModel;