const pool = require('../../config/db');
const bcrypt = require('bcrypt');

class ProfileModel {

    /**
     * Mengambil informasi dasar profil admin.
     */
    static async getProfileInfo(adminId, connection = pool) {
        const [rows] = await connection.execute(
            'SELECT user_id, username, full_name, phone_number, last_login FROM users WHERE user_id = ?',
            [adminId]
        );
        return rows[0];
    }

    /**
     * Mengambil ringkasan aktivitas admin.
     */
    static async getActivitySummary(adminId, connection = pool) {
        const [rows] = await connection.execute(`
            SELECT
                (SELECT COUNT(id) FROM financials WHERE created_by = ?) as total_financial_transactions,
                (SELECT COUNT(equity_transaction_id) FROM equity_transactions WHERE created_by = ? AND type = 'LABA_DITAHAN_PERIODIK') as total_book_closings
        `, [adminId, adminId]);
        return rows[0];
    }

    /**
     * Mengambil log aktivitas admin (jejak audit).
     */
    static async getActivityLog(adminId, connection = pool) {
        const [rows] = await connection.execute(`
            SELECT action, description, ip_address, device_info, created_at
            FROM system_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50; -- Batasi untuk performa
        `, [adminId]);
        return rows;
    }

    /**
     * Memperbarui informasi profil admin.
     */
static async updateProfile(adminId, data, connection = pool) {
    const { full_name, phone_number, username } = data;

    // 1. Validasi agar username baru tidak bentrok dengan user lain
    if (username) {
        const [existingUser] = await connection.execute(
            'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
            [username, adminId]
        );
        if (existingUser.length > 0) {
            throw new Error('Username sudah digunakan oleh pengguna lain.');
        }
    }
    
    // 2. Lakukan pembaruan data
    const [result] = await connection.execute(
        'UPDATE users SET full_name = ?, phone_number = ?, username = ? WHERE user_id = ?',
        [full_name, phone_number, username, adminId]
    );
    return result.affectedRows > 0;
}


    /**
     * Mengubah password admin.
     */
    static async changePassword(adminId, oldPassword, newPassword, connection = pool) {
        const [rows] = await connection.execute('SELECT password FROM users WHERE user_id = ?', [adminId]);
        if (rows.length === 0) {
            throw new Error('User tidak ditemukan.');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new Error('Password lama tidak cocok.');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedNewPassword, adminId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = ProfileModel;