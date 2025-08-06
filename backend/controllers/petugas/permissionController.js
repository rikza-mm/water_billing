const pool = require('../../config/db');
const { logger } = require('../../utils/logger');

/**
 * Check current user permissions and area assignments
 * Lightweight endpoint untuk real-time permission checking
 */
exports.checkPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current area assignments
    const [areaRows] = await pool.execute(`
      SELECT 
        oa.area_id, 
        a.area_name,
        oa.created_at as assigned_date,
        COALESCE(oa.updated_at, oa.created_at) as last_updated
      FROM officer_areas oa
      JOIN areas a ON oa.area_id = a.area_id
      WHERE oa.user_id = ?
      ORDER BY oa.created_at DESC
    `, [userId]);

    // Fallback to officers table if no data in officer_areas
    let fallbackAreas = [];
    if (areaRows.length === 0) {
      const [officerRows] = await pool.execute(`
        SELECT 
          o.area_id,
          a.area_name,
          o.join_date as assigned_date,
          COALESCE(o.updated_at, o.join_date) as last_updated
        FROM officers o
        JOIN areas a ON o.area_id = a.area_id
        WHERE o.user_id = ? AND o.area_id IS NOT NULL
      `, [userId]);
      
      fallbackAreas = officerRows;
    }

    const finalAreas = areaRows.length > 0 ? areaRows : fallbackAreas;

    // Get user info for additional context
    const [userRows] = await pool.execute(`
      SELECT 
        user_id,
        username,
        full_name,
        role,
        is_active,
        updated_at
      FROM users 
      WHERE user_id = ?
    `, [userId]);

    const user = userRows[0];

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (!user.is_active) {
      logger.warn(`Inactive user access attempt: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'User tidak aktif',
        code: 'USER_INACTIVE'
      });
    }

    // Calculate last updated time
    let lastUpdated = user.updated_at;
    if (finalAreas.length > 0 && finalAreas[0].last_updated) {
        const areaLastUpdated = Math.max(...finalAreas.map(area => new Date(area.last_updated).getTime()));
        const userLastUpdated = new Date(user.updated_at).getTime();
        lastUpdated = new Date(Math.max(areaLastUpdated, userLastUpdated));
    }

    // Format response
    const assignedAreas = finalAreas.map(area => ({
      area_id: area.area_id,
      area_name: area.area_name,
      assigned_date: area.assigned_date
    }));

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Permissions checked for user ${userId}: ${assignedAreas.length} areas`);
    }

    res.json({
      success: true,
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        },
        assignedAreas,
        assignedAreaIds: assignedAreas.map(area => area.area_id),
        hasAreaAccess: assignedAreas.length > 0,
        lastUpdated: lastUpdated.toISOString(),
        source: areaRows.length > 0 ? 'officer_areas' : 'officers'
      }
    });

  } catch (error) {
    logger.error('Permission check failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengecek permissions',
      error: error.message
    });
  }
};

/**
 * Get detailed permission info including statistics
 */
exports.getDetailedPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get area assignments with statistics
    const [areaStats] = await pool.execute(`
      SELECT 
        oa.area_id,
        a.area_name,
        oa.created_at as assigned_date,
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.customer_id END) as active_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'inactive' THEN c.customer_id END) as inactive_customers,
        COUNT(DISTINCT mr.reading_id) as total_readings,
        COUNT(DISTINCT CASE WHEN mr.reading_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN mr.reading_id END) as recent_readings
      FROM officer_areas oa
      JOIN areas a ON oa.area_id = a.area_id
      LEFT JOIN customers c ON a.area_id = c.area_id
      LEFT JOIN meter_readings mr ON c.customer_id = mr.customer_id
      WHERE oa.user_id = ?
      GROUP BY oa.area_id, a.area_name, oa.created_at
      ORDER BY oa.created_at DESC
    `, [userId]);

    // Get recent activity
    const [recentActivity] = await pool.execute(`
      SELECT 
        'meter_reading' as activity_type,
        mr.reading_date as activity_date,
        c.full_name as customer_name,
        a.area_name,
        mr.current_reading as details
      FROM meter_readings mr
      JOIN customers c ON mr.customer_id = c.customer_id
      JOIN areas a ON c.area_id = a.area_id
      JOIN officer_areas oa ON a.area_id = oa.area_id
      WHERE oa.user_id = ? AND mr.reading_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'payment' as activity_type,
        p.payment_date as activity_date,
        c.full_name as customer_name,
        a.area_name,
        CONCAT('Rp ', FORMAT(p.amount, 0)) as details
      FROM payments p
      JOIN bills b ON p.bill_id = b.bill_id
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN areas a ON c.area_id = a.area_id
      JOIN officer_areas oa ON a.area_id = oa.area_id
      WHERE oa.user_id = ? AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      ORDER BY activity_date DESC
      LIMIT 10
    `, [userId, userId]);

    res.json({
      success: true,
      data: {
        areaAssignments: areaStats,
        recentActivity,
        summary: {
          totalAreas: areaStats.length,
          totalCustomers: areaStats.reduce((sum, area) => sum + area.total_customers, 0),
          activeCustomers: areaStats.reduce((sum, area) => sum + area.active_customers, 0),
          totalReadings: areaStats.reduce((sum, area) => sum + area.total_readings, 0),
          recentReadings: areaStats.reduce((sum, area) => sum + area.recent_readings, 0)
        }
      }
    });

  } catch (error) {
    logger.error('Detailed permissions check failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail permissions',
      error: error.message
    });
  }
};

/**
 * Force refresh user permissions (clear cache, reload from DB)
 */
exports.refreshPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get fresh data
    const checkResult = await exports.checkPermissions(req, res);
    
    return checkResult;

  } catch (error) {
    logger.error('Permission refresh failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat refresh permissions',
      error: error.message
    });
  }
};
