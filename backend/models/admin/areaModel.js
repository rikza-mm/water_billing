const pool = require('../../config/db');

class AdminAreaModel {
  /**
   * Get all areas with enhanced filtering and statistics
   */
  static async getAllAreasWithFilters(filters = {}) {
    let query = `
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        a.created_at,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.customer_id END) AS active_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'inactive' THEN c.customer_id END) AS inactive_customers,
        COUNT(DISTINCT oa.user_id) AS total_officers,
        COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) AS total_revenue,
        COUNT(DISTINCT CASE WHEN b.status IN ('unpaid', 'overdue') THEN b.bill_id END) AS unpaid_bills
      FROM areas a
      LEFT JOIN customers c ON c.area_id = a.area_id
      LEFT JOIN officer_areas oa ON oa.area_id = a.area_id
      LEFT JOIN bills b ON b.customer_id = c.customer_id
    `;

    const conditions = [];
    const params = [];

    if (filters.search) {
      conditions.push('(a.area_name LIKE ? OR a.postal_code LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.postal_code) {
      conditions.push('a.postal_code = ?');
      params.push(filters.postal_code);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY a.area_id';

    const havingConditions = [];

    if (filters.has_officers !== undefined) {
      if (filters.has_officers) {
        havingConditions.push('COUNT(DISTINCT oa.user_id) > 0');
      } else {
        havingConditions.push('COUNT(DISTINCT oa.user_id) = 0');
      }
    }

    if (filters.has_customers !== undefined) {
      if (filters.has_customers) {
        havingConditions.push('COUNT(DISTINCT c.customer_id) > 0');
      } else {
        havingConditions.push('COUNT(DISTINCT c.customer_id) = 0');
      }
    }

    if (havingConditions.length > 0) {
      query += ' HAVING ' + havingConditions.join(' AND ');
    }

    query += ' ORDER BY a.area_name ASC';

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as counted_areas`;
    const [countResult] = await pool.execute(countQuery, params);
    const totalItems = countResult[0].total;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get assigned officers for each area
    const areasWithOfficers = await Promise.all(rows.map(async (area) => {
      const [officers] = await pool.execute(`
        SELECT
          u.user_id,
          u.full_name,
          u.username,
          u.phone_number,
          u.is_active,
          COUNT(DISTINCT c.customer_id) AS total_customers
        FROM officer_areas oa
        JOIN users u ON u.user_id = oa.user_id
        LEFT JOIN customers c ON c.area_id = oa.area_id
        WHERE oa.area_id = ? AND u.role = 'petugas'
        GROUP BY u.user_id
      `, [area.area_id]);

      return {
        ...area,
        assigned_officers: officers,
        total_revenue: parseFloat(area.total_revenue || 0)
      };
    }));

    return {
      data: areasWithOfficers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalItems / limit),
        total_items: totalItems,
        per_page: limit
      }
    };
  }

  /**
   * Get comprehensive area statistics
   */
  static async getAreaStatistics() {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(DISTINCT a.area_id) AS total_areas,
        COUNT(DISTINCT CASE WHEN oa.user_id IS NOT NULL THEN a.area_id END) AS areas_with_officers,
        COUNT(DISTINCT CASE WHEN oa.user_id IS NULL THEN a.area_id END) AS areas_without_officers,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT oa.user_id) AS total_officers,
        COALESCE(AVG(customer_counts.customer_count), 0) AS average_customers_per_area,
        COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) AS total_revenue,
        COUNT(DISTINCT CASE WHEN b.status IN ('unpaid', 'overdue') THEN b.bill_id END) AS total_unpaid_bills
      FROM areas a
      LEFT JOIN officer_areas oa ON oa.area_id = a.area_id
      LEFT JOIN customers c ON c.area_id = a.area_id
      LEFT JOIN bills b ON b.customer_id = c.customer_id
      LEFT JOIN (
        SELECT area_id, COUNT(customer_id) as customer_count
        FROM customers
        GROUP BY area_id
      ) customer_counts ON customer_counts.area_id = a.area_id
    `);

    return rows[0];
  }

  /**
   * Create new area
   */
  static async createArea(data) {
    const [result] = await pool.execute(
      'INSERT INTO areas (area_name, postal_code) VALUES (?, ?)',
      [data.area_name, data.postal_code || null]
    );
    return result.insertId;
  }

  /**
   * Update area
   */
  static async updateArea(areaId, data) {
    const [result] = await pool.execute(
      'UPDATE areas SET area_name = ?, postal_code = ? WHERE area_id = ?',
      [data.area_name, data.postal_code || null, areaId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete area
   */
  static async deleteArea(areaId) {
    // Check if area has customers
    const [customers] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE area_id = ?',
      [areaId]
    );

    if (customers[0].count > 0) {
      throw new Error('Tidak dapat menghapus area yang masih memiliki pelanggan');
    }

    // Remove officer assignments first
    await pool.execute('DELETE FROM officer_areas WHERE area_id = ?', [areaId]);

    // Delete area
    const [result] = await pool.execute('DELETE FROM areas WHERE area_id = ?', [areaId]);
    return result.affectedRows > 0;
  }

  /**
   * Get area details with officers and recent activities
   */
  static async getAreaDetails(areaId) {
    const [areaRows] = await pool.execute(`
    SELECT
        u.user_id, u.full_name, u.username, u.phone_number, u.is_active,
        (SELECT COUNT(c.customer_id) FROM customers c WHERE c.area_id IN (SELECT oa.area_id FROM officer_areas WHERE oa.user_id = u.user_id)) AS total_customers_handled
      FROM users u
      JOIN officer_areas oa ON u.user_id = oa.user_id
      WHERE oa.area_id = ? AND u.role = 'petugas'
      GROUP BY u.user_id;
    `, [areaId]);

    if (areaRows.length === 0) return null;

    const area = areaRows[0];

    // Get assigned officers
    const [officers] = await pool.execute(`
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.phone_number,
        u.is_active,
        COUNT(DISTINCT c.customer_id) AS total_customers
      FROM officer_areas oa
      JOIN users u ON u.user_id = oa.user_id
      LEFT JOIN customers c ON c.area_id = oa.area_id
      WHERE oa.area_id = ? AND u.role = 'petugas'
      GROUP BY u.user_id
    `, [areaId]);

    // Get recent activities
    const [activities] = await pool.execute(`
      SELECT
        'meter_reading' as activity_type,
        mr.reading_date as activity_date,
        c.full_name as customer_name,
        u.full_name as officer_name
      FROM meter_readings mr
      JOIN customers c ON c.customer_id = mr.customer_id
      LEFT JOIN users u ON u.user_id = mr.officer_id
      WHERE c.area_id = ?
      ORDER BY mr.reading_date DESC
      LIMIT 10
    `, [areaId]);

    return {
      ...area,
      assigned_officers: officers,
      recent_activities: activities
    };
  }

  /**
   * Export area data
   */
  static async exportAreaData() {
    const [rows] = await pool.execute(`
      SELECT
        a.area_id,
        a.area_name,
        a.postal_code,
        a.created_at,
        COUNT(DISTINCT c.customer_id) AS total_customers,
        COUNT(DISTINCT oa.user_id) AS total_officers,
        COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) AS total_revenue
      FROM areas a
      LEFT JOIN customers c ON c.area_id = a.area_id
      LEFT JOIN officer_areas oa ON oa.area_id = a.area_id
      LEFT JOIN bills b ON b.customer_id = c.customer_id
      GROUP BY a.area_id
      ORDER BY a.area_name ASC
    `);

    return rows.map(area => ({
      ...area,
      total_revenue: parseFloat(area.total_revenue || 0)
    }));
  }
}

module.exports = AdminAreaModel;