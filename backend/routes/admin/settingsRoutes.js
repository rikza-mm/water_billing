const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settingsController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { body } = require('express-validator');
const { escape } = require('validator');

// Endpoint untuk menampilkan pengaturan
router.get('/', authMiddleware, roleMiddleware(['petugas', 'admin']), settingsController.getSettings);

// Endpoint khusus admin untuk memperbarui pengaturan
router.put(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body().custom((value, { req }) => {
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        throw new Error('Body harus berupa objek key-value.');
      }
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const singleValue = value[key];
          if (typeof singleValue !== 'string' || singleValue.trim() === '') {
            throw new Error(`Nilai untuk '${key}' harus berupa string dan tidak boleh kosong.`);
          }
          req.body[key] = escape(singleValue.trim());
        }
      }
      return true;
    })
  ],
  settingsController.updateSettings
);

module.exports = router;