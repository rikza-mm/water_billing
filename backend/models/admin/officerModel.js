const pool = require('../../config/db');
const bcrypt = require('bcrypt');

class AdminOfficerModel {
  /**
   * Get all officers with enhanced filtering and statistics
   */
  static async getAllOfficersWithFilters(filters = {}) {
    let query = `
      SELECT
        u.user_id, u.username, u.full_name, u.phone_number, u.whatsapp_number,
        u.role, u.is_active, u.salary, u.join_date, u.last_login,
        (SELECT COUNT(c.customer_id) FROM customers c WHERE c.area_id IN (SELECT oa.area_id FROM officer_areas oa WHERE oa.user_id = u.user_id)) AS total_customers,
        GROUP_CONCAT(DISTINCT a.area_name SEPARATOR ', ') AS areas
      FROM users u
      LEFT JOIN officer_areas oa ON oa.user_id = u.user_id
      LEFT JOIN areas a ON a.area_id = oa.area_id
      WHERE u.role = 'petugas'
    `;
    const conditions = [];
    const params = [];

    if (filters.search) {
      conditions.push('(u.full_name LIKE ? OR u.username LIKE ? OR u.phone_number LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        conditions.push('u.is_active = 1');
      } else if (filters.status === 'inactive') {
        conditions.push('u.is_active = 0');
      }
    }

    if (filters.area_id) {
      conditions.push('oa.area_id = ?');
      params.push(filters.area_id);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' GROUP BY u.user_id, u.username, u.full_name, u.phone_number, u.whatsapp_number, u.role, u.is_active, u.salary, u.join_date, u.last_login';

    // Add HAVING conditions for aggregated filters
    const havingConditions = [];

    if (filters.has_area !== undefined) {
      if (filters.has_area) {
        havingConditions.push('COUNT(DISTINCT oa.area_id) > 0');
      } else {
        havingConditions.push('COUNT(DISTINCT oa.area_id) = 0');
      }
    }

    if (filters.available_for_assignment) {
      havingConditions.push('COUNT(DISTINCT oa.area_id) = 0');
    }

    if (havingConditions.length > 0) {
      query += ' HAVING ' + havingConditions.join(' AND ');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    // Create count query without LIMIT and OFFSET
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as counted_officers`;
    const [countResult] = await pool.execute(countQuery, params);
    const totalItems = countResult[0].total;

    // Add pagination to main query
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Format the results
    const officers = rows.map(officer => ({
      ...officer,
      officer_id: officer.user_id, // For compatibility (frontend)
      status: officer.is_active ? 'active' : 'inactive',
      areas: officer.areas ? officer.areas.split(', ').map(name => ({ name })) : [],
      salary: parseFloat(officer.salary || 0),
      total_customers: parseInt(officer.total_customers || 0)
    }));

    return {
      data: officers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalItems / limit),
        total_items: totalItems,
        per_page: limit
      }
    };
  }

  /**
   * Get comprehensive officer statistics
   */
  static async getOfficerStatistics() {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(DISTINCT u.user_id) AS total_officers,
        COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.user_id END) AS active_officers,
        COUNT(DISTINCT CASE WHEN u.is_active = 0 THEN u.user_id END) AS inactive_officers,
        COUNT(DISTINCT a.area_id) AS total_areas,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT CASE WHEN oa.area_id IS NULL THEN u.user_id END) AS unassigned_officers,
        COUNT(DISTINCT CASE WHEN officer_count.officer_count = 0 THEN a.area_id END) AS areas_without_officers,
        COALESCE(AVG(customer_counts.customer_count), 0) AS average_customers_per_officer,
        COUNT(DISTINCT CASE WHEN oa.area_id IS NOT NULL THEN a.area_id END) AS total_areas_covered,
        COUNT(DISTINCT CASE WHEN c.customer_id IS NOT NULL THEN c.customer_id END) AS total_customers_served
      FROM users u
      LEFT JOIN officer_areas oa ON oa.user_id = u.user_id
      LEFT JOIN areas a ON a.area_id = oa.area_id
      LEFT JOIN customers c ON c.area_id = oa.area_id
      LEFT JOIN (
        SELECT area_id, COUNT(customer_id) as customer_count
        FROM customers
        GROUP BY area_id
      ) customer_counts ON customer_counts.area_id = oa.area_id
      LEFT JOIN (
        SELECT area_id, COUNT(user_id) as officer_count
        FROM officer_areas
        GROUP BY area_id
      ) officer_count ON officer_count.area_id = a.area_id
      WHERE u.role = 'petugas'
    `);

    return {
      ...rows[0],
      average_customers_per_officer: Math.round(rows[0].average_customers_per_officer || 0)
    };
  }

  /**
   * Create new officer
   */
  static async createOfficer(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [result] = await pool.execute(`
      INSERT INTO users (
        username, password, full_name, phone_number, whatsapp_number,
        role, is_active, salary, join_date
      ) VALUES (?, ?, ?, ?, ?, 'petugas', 1, ?, ?)
    `, [
      data.username,
      hashedPassword,
      data.full_name,
      data.phone_number,
      data.whatsapp_number || null,
      data.salary || 0,
      data.join_date || new Date().toISOString().split('T')[0]
    ]);

    const userId = result.insertId;

    // Assign to areas if provided
    if (data.area_ids && data.area_ids.length > 0) {
      for (const areaId of data.area_ids) {
        await pool.execute(
          'INSERT INTO officer_areas (user_id, area_id) VALUES (?, ?)',
          [userId, areaId]
        );
      }
    }

    return userId;
  }

  /**
   * Update officer
   */
  static async updateOfficer(userId, data) {
    const updateFields = [];
    const params = [];

    if (data.username) {
      updateFields.push('username = ?');
      params.push(data.username);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.push('password = ?');
      params.push(hashedPassword);
    }

    if (data.full_name) {
      updateFields.push('full_name = ?');
      params.push(data.full_name);
    }

    if (data.phone_number) {
      updateFields.push('phone_number = ?');
      params.push(data.phone_number);
    }

    if (data.whatsapp_number !== undefined) {
      updateFields.push('whatsapp_number = ?');
      params.push(data.whatsapp_number);
    }

    if (data.salary !== undefined) {
      updateFields.push('salary = ?');
      params.push(data.salary);
    }

    if (data.join_date) {
      updateFields.push('join_date = ?');
      params.push(data.join_date);
    }

    if (data.is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return false;
    }

    params.push(userId);
    const [result] = await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ? AND role = 'petugas'`,
      params
    );

    // Update area assignments if provided
    if (data.area_ids !== undefined) {
      // Remove existing assignments
      await pool.execute('DELETE FROM officer_areas WHERE user_id = ?', [userId]);

      // Add new assignments
      if (data.area_ids.length > 0) {
        for (const areaId of data.area_ids) {
          await pool.execute(
            'INSERT INTO officer_areas (user_id, area_id) VALUES (?, ?)',
            [userId, areaId]
          );
        }
      }
    }

    return result.affectedRows > 0;
  }

  /**
   * Validate if officer can be deleted
   */
  static async validateOfficerDeletion(userId) {
    const validationResult = {
      canDelete: false,
      reasons: [],
      details: {}
    };

    try {
      // Cek customer melalui area assignment
      const [customersInAssignedAreas] = await pool.execute(`
        SELECT COUNT(DISTINCT c.customer_id) as count
        FROM customers c
        INNER JOIN officer_areas oa ON c.area_id = oa.area_id
        WHERE oa.user_id = ?
      `, [userId]);

      if (customersInAssignedAreas[0].count > 0) {
        validationResult.reasons.push(`Bertanggung jawab atas ${customersInAssignedAreas[0].count} pelanggan di area yang ditugaskan`);
        validationResult.details.customersInAreas = customersInAssignedAreas[0].count;
      }

      // Cek riwayat pembacaan meter
      const [meterReadings] = await pool.execute(
        'SELECT COUNT(*) as count FROM meter_readings WHERE user_id = ?',
        [userId]
      );

      if (meterReadings[0].count > 0) {
        validationResult.reasons.push(`Memiliki ${meterReadings[0].count} riwayat pembacaan meter`);
        validationResult.details.meterReadings = meterReadings[0].count;
      }

      // Cek riwayat pembayaran
      const [payments] = await pool.execute(
        'SELECT COUNT(*) as count FROM payments WHERE user_id = ?',
        [userId]
      );

      if (payments[0].count > 0) {
        validationResult.reasons.push(`Memiliki ${payments[0].count} riwayat pembayaran`);
        validationResult.details.payments = payments[0].count;
      }

      // Cek area assignments
      const [areaAssignments] = await pool.execute(`
        SELECT COUNT(*) as count, GROUP_CONCAT(a.area_name) as area_names
        FROM officer_areas oa
        JOIN areas a ON oa.area_id = a.area_id
        WHERE oa.user_id = ?
      `, [userId]);

      if (areaAssignments[0].count > 0) {
        validationResult.details.assignedAreas = areaAssignments[0].area_names;
        validationResult.details.areaCount = areaAssignments[0].count;
      }

      validationResult.canDelete = validationResult.reasons.length === 0;

      return validationResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete officer
   */
  static async deleteOfficer(userId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // ✅ PERBAIKAN: Cek customer melalui area assignment, bukan direct assignment
      const [customersInAssignedAreas] = await connection.execute(`
        SELECT COUNT(DISTINCT c.customer_id) as count
        FROM customers c
        INNER JOIN officer_areas oa ON c.area_id = oa.area_id
        WHERE oa.user_id = ?
      `, [userId]);

      if (customersInAssignedAreas[0].count > 0) {
        throw new Error(`Tidak dapat menghapus petugas yang masih bertanggung jawab atas ${customersInAssignedAreas[0].count} pelanggan di area yang ditugaskan. Pindahkan atau hapus penugasan area terlebih dahulu.`);
      }

      // ✅ PERBAIKAN: Cek apakah ada data terkait lainnya
      const [meterReadings] = await connection.execute(
        'SELECT COUNT(*) as count FROM meter_readings WHERE user_id = ?',
        [userId]
      );

      const [payments] = await connection.execute(
        'SELECT COUNT(*) as count FROM payments WHERE user_id = ?',
        [userId]
      );

      if (meterReadings[0].count > 0 || payments[0].count > 0) {
        throw new Error(`Tidak dapat menghapus petugas yang memiliki riwayat pembacaan meter (${meterReadings[0].count}) atau pembayaran (${payments[0].count}). Data historis harus dipertahankan.`);
      }

      // ✅ PERBAIKAN: Hapus dalam urutan yang benar untuk menghindari foreign key constraint

      // 1. Hapus area assignments
      await connection.execute('DELETE FROM officer_areas WHERE user_id = ?', [userId]);

      // 2. Terakhir hapus dari users
      const [result] = await connection.execute(
        'DELETE FROM users WHERE user_id = ? AND role = "petugas"',
        [userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Petugas tidak ditemukan atau bukan role petugas');
      }

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get officer by ID with detailed information
   */
  static async getOfficerById(userId) {
    // Get basic officer information
    const [officerRows] = await pool.execute(`
      SELECT
        u.user_id, u.username, u.full_name, u.phone_number, u.whatsapp_number,
        u.role, u.is_active, u.is_login_allowed, u.salary, u.join_date, u.last_login,
        u.created_at, u.updated_at
      FROM users u
      WHERE u.user_id = ? AND u.role = 'petugas'
    `, [userId]);

    if (officerRows.length === 0) return null;

    const officer = officerRows[0];

    // Get performance metrics
    const [performanceRows] = await pool.execute(`
      SELECT
        (SELECT COUNT(DISTINCT c.customer_id) 
         FROM customers c 
         INNER JOIN officer_areas oa ON c.area_id = oa.area_id 
         WHERE oa.user_id = ?) as total_customers_handled,
        (SELECT COUNT(*) FROM meter_readings WHERE user_id = ?) as total_readings_made,
        (SELECT COUNT(*) FROM meter_readings 
         WHERE user_id = ? AND reading_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as readings_last_30_days
    `, [userId, userId, userId]);

    // Get area assignments with customer counts
    const [assignmentRows] = await pool.execute(`
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        COUNT(DISTINCT c.customer_id) as customers_in_area
      FROM officer_areas oa
      JOIN areas a ON a.area_id = oa.area_id
      LEFT JOIN customers c ON c.area_id = a.area_id
      WHERE oa.user_id = ?
      GROUP BY a.area_id, a.area_name, a.postal_code
      ORDER BY a.area_name ASC
    `, [userId]);

    // Format the response
    return {
      profile: {
        user_id: officer.user_id,
        username: officer.username,
        full_name: officer.full_name,
        phone_number: officer.phone_number,
        whatsapp_number: officer.whatsapp_number,
        join_date: officer.join_date,
        status: officer.is_active ? 'active' : 'inactive'
      },
      performance: {
        total_customers_handled: parseInt(performanceRows[0].total_customers_handled || 0),
        total_readings_made: parseInt(performanceRows[0].total_readings_made || 0),
        readings_last_30_days: parseInt(performanceRows[0].readings_last_30_days || 0)
      },
      assignments: assignmentRows.map(row => ({
        area_id: row.area_id,
        area_name: row.area_name,
        customers_in_area: parseInt(row.customers_in_area || 0)
      })),
      activity: {
        last_login: officer.last_login,
        is_login_allowed: Boolean(officer.is_login_allowed)
      }
    };
  }

  /**
   * Get available areas for assignment
   */
  static async getAvailableAreas() {
    const [rows] = await pool.execute(`
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT oa.user_id) AS total_officers
      FROM areas a
      LEFT JOIN customers c ON c.area_id = a.area_id
      LEFT JOIN officer_areas oa ON oa.area_id = a.area_id
      GROUP BY a.area_id
      ORDER BY a.area_name ASC
    `);

    return rows;
  }

  /**
   * Soft delete officer (deactivate instead of delete)
   * Alternative yang lebih aman untuk mempertahankan data historis
   */
  static async deactivateOfficer(userId, reason = 'Dihapus oleh admin') {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update status user menjadi inactive
      const [userResult] = await connection.execute(
        'UPDATE users SET is_active = 0, is_login_allowed = 0, updated_at = NOW() WHERE user_id = ? AND role = "petugas"',
        [userId]
      );

      if (userResult.affectedRows === 0) {
        throw new Error('Petugas tidak ditemukan atau bukan role petugas');
      }

      // Hapus area assignments (karena petugas sudah tidak aktif)
      await connection.execute('DELETE FROM officer_areas WHERE user_id = ?', [userId]);

      // Log deactivation
      await connection.execute(`
        INSERT INTO system_logs (user_id, action, description, created_at)
        VALUES (?, 'OFFICER_DEACTIVATED', ?, NOW())
      `, [userId, `Petugas dinonaktifkan: ${reason}`]);

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reactivate officer
   */
  static async reactivateOfficer(userId) {
    const [result] = await pool.execute(
      'UPDATE users SET is_active = 1, is_login_allowed = 1, updated_at = NOW() WHERE user_id = ? AND role = "petugas"',
      [userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Petugas tidak ditemukan atau bukan role petugas');
    }

    // Log reactivation
    await pool.execute(`
      INSERT INTO system_logs (user_id, action, description, created_at)
      VALUES (?, 'OFFICER_REACTIVATED', 'Petugas diaktifkan kembali', NOW())
    `, [userId]);

    return true;
  }
}

module.exports = AdminOfficerModel;