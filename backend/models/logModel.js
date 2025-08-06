const pool = require('../config/db');

class LogModel {
  constructor(data) {
    this.log_id = data.log_id;
    this.user_id = data.user_id;
    this.log_type = data.log_type;
    this.action = data.action;
    this.description = data.description;
    this.affected_table = data.affected_table;
    this.affected_id = data.affected_id;
    this.ip_address = data.ip_address;
    this.device_info = data.device_info;
    this.severity = data.severity;
    this.created_at = data.created_at;
  }

  static async create(logData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO system_logs 
        (user_id, log_type, action, description, affected_table, 
         affected_id, ip_address, device_info, severity) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.user_id,
          logData.log_type,
          logData.action,
          logData.description,
          logData.affected_table,
          logData.affected_id,
          logData.ip_address,
          logData.device_info,
          logData.severity
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating log: ${error.message}`);
    }
  }

  static async getDailyLogs(date, userId = null) {
    try {
      let query = `
        SELECT l.*, u.username, u.full_name 
        FROM system_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
        WHERE DATE(l.created_at) = ?
      `;
      const params = [date];

      if (userId) {
        query += ' AND l.user_id = ?';
        params.push(userId);
      }

      query += ' ORDER BY l.created_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting daily logs: ${error.message}`);
    }
  }

  static async getActivityLogs(filters = {}) {
    try {
      let query = `
        SELECT l.*, u.username, u.full_name 
        FROM system_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.startDate) {
        query += ' AND DATE(l.created_at) >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND DATE(l.created_at) <= ?';
        params.push(filters.endDate);
      }

      if (filters.logType) {
        query += ' AND l.log_type = ?';
        params.push(filters.logType);
      }

      if (filters.severity) {
        query += ' AND l.severity = ?';
        params.push(filters.severity);
      }

      query += ' ORDER BY l.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting activity logs: ${error.message}`);
    }
  }

  static async getUserActivitySummary(userId, startDate, endDate) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          log_type,
          COUNT(*) as total_actions,
          DATE(created_at) as action_date
         FROM system_logs
         WHERE user_id = ?
         AND DATE(created_at) BETWEEN ? AND ?
         GROUP BY log_type, DATE(created_at)
         ORDER BY action_date DESC`,
        [userId, startDate, endDate]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting user activity summary: ${error.message}`);
    }
  }

  static async getSystemErrors(days = 7) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM system_logs
         WHERE log_type = 'error'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY created_at DESC`,
        [days]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting system errors: ${error.message}`);
    }
  }
}

module.exports = LogModel;