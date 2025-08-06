const pool = require('../config/db');
const { hashPassword } = require('../utils/hashPassword');

class AuthModel {
  /**
   * Mencari user berdasarkan username
   * @param {string} username 
   * @returns {Object|null}
   */
  static async findUserByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  }

  /**
   * Registrasi user baru dengan hash password
   * @param {Object} userData 
   * @returns {number} userId
   */
  static async register(userData) {
    const { username, full_name, password, role, phone_number } = userData;
    const hashedPassword = await hashPassword(password);

    const [result] = await pool.execute(
      `INSERT INTO users (
        username, full_name, password, role, phone_number, is_active, is_login_allowed
      ) VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [username, full_name, hashedPassword, role, phone_number]
    );
    return result.insertId;
  }

  /**
   * Mencatat log login pengguna
   * @param {number} userId 
   * @param {string} ipAddress 
   * @param {string} userAgent 
   * @param {boolean} success 
   */
  static async createLoginLog(userId, ipAddress, userAgent, success) {
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');

    // Catat ke login_attempts
    await pool.execute(
      `INSERT INTO login_attempts (
        username, ip_address, success, attempt_time
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [user.username, ipAddress, success]
    );

    // Jika login berhasil, catat ke system_logs
    if (success) {
      await pool.execute(
        `INSERT INTO system_logs (
          user_id, log_type, action, description, ip_address, device_info, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'user_activity', 'login', 'User melakukan login', ipAddress, userAgent, 'info']
      );
    }
  }

  /**
   * Mencatat log logout pengguna
   * @param {number} userId 
   * @param {string} ipAddress 
   * @param {string} userAgent 
   */
  static async createLogoutLog(userId, ipAddress, userAgent) {
    await pool.execute(
      `INSERT INTO system_logs (
        user_id, log_type, action, description, ip_address, device_info, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'user_activity', 'logout', 'User melakukan logout', ipAddress, userAgent, 'info']
    );
  }

  /**
   * Mencari user berdasarkan ID
   * @param {number} userId 
   * @returns {Object|null}
   */
  static async findUserById(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  }
}

module.exports = AuthModel;
