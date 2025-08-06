// backend/services/syncService.js
const pool = require('../config/database');

class SyncService {
  static async syncOfflineData(officerId) {
    await pool.query('CALL SyncOfflineData(?)', [officerId]);
  }
}

module.exports = SyncService;