const pool = require('../../config/db');

class SettingsModel {
    static async getAll() {
        const [rows] = await pool.query('CALL GetAllAppSettings()');
        return rows[0];
    }

    static async update(key, value) {
        await pool.query('CALL UpdateAppSetting(?, ?)', [key, value]);
    }
}
module.exports = SettingsModel;