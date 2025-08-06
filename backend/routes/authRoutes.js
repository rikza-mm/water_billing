const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Route publik
//router.post(
  //'/register',
  ///authMiddleware,
  //roleMiddleware(['admin']),
  //[
    //body('username')
      //.isAlphanumeric().withMessage('Username hanya boleh huruf/angka')
      //.isLength({ min: 4, max: 20 }).withMessage('Username 4-20 karakter'),
    //body('full_name')
      //.trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
    //body('password')
//      .isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
//    body('role')
//      .isIn(['admin', 'petugas']).withMessage('Role tidak valid'),
//    body('phone_number')
//      .isMobilePhone('id-ID').withMessage('Nomor HP tidak valid')
//      .escape(), 
//  ],
//  (req, res, next) => {
//    const errors = validationResult(req);
//    if (!errors.isEmpty()) {
//      return res.status(400).json({ success: false, errors: errors.array() });
//    }
//    next();
//  },
//  AuthController.register
//);


router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username wajib diisi'),
    body('password').notEmpty().withMessage('Password wajib diisi')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  AuthController.login
);

// Route terproteksi
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;