const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settingsController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { body } = require('express-validator');
//const { escape } = require('validator');
const he = require('he');

// Endpoint untuk menampilkan pengaturan
router.get('/', authMiddleware, roleMiddleware(['petugas', 'admin']), settingsController.getSettings);

// Endpoint khusus admin untuk memperbarui pengaturan
router.put(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body().custom((value, { req }) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('Body harus berupa objek key-value.');
      }
      // Iterasi melalui setiap key di body
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          // Decode setiap value untuk membersihkannya dari HTML entities
          // Ini akan mengubah 'https:&#x2F;&#x2F;...' kembali menjadi 'https://...'
          req.body[key] = he.decode(String(value[key]));
        }
      }
      return true;
    })
  ],
  settingsController.updateSettings
);

module.exports = router;