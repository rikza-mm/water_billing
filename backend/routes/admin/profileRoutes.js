const express = require('express');
const router = express.Router();
const ProfileController = require('../../controllers/admin/profileController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { body } = require('express-validator');

// Terapkan middleware untuk semua rute di file ini
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Endpoint untuk mengambil semua data dasbor profil
router.get('/', ProfileController.getAdminProfileDashboard);

// Endpoint untuk memperbarui informasi profil
router.put(
  '/',
  [
    body('full_name').isString().notEmpty().withMessage('Nama lengkap wajib diisi.').trim().escape(),
    body('phone_number').isString().notEmpty().withMessage('Nomor telepon wajib diisi.').trim().escape(),
    body('username').isString().notEmpty().withMessage('Username wajib diisi.').trim().escape()
  ],
  ProfileController.updateProfile
);

// Endpoint untuk mengubah password
router.put(
  '/change-password',
  [
    body('oldPassword').isString().notEmpty().withMessage('Password lama wajib diisi.'),
    // Gunakan aturan validasi terkuat (minimal 8 karakter)
    body('newPassword').isString().isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.')
  ],
  ProfileController.changePassword
);

module.exports = router;