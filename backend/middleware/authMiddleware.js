const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    // ✅ Ekstrak token dari header
    const token = authHeader.split(' ')[1];

    // ✅ Verifikasi token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      const msg = error.name === 'TokenExpiredError'
        ? 'Token sudah kadaluarsa'
        : 'Token tidak valid';
      return res.status(401).json({ success: false, message: msg });
    }

    // ✅ Validasi isi token
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }

    // ✅ Cek user dari database
    const user = await AuthModel.findUserById(decoded.id);
    if (!user) {
      return res.status(403).json({ success: false, message: 'User tidak ditemukan' });
    }

    // ✅ Cek status user (aktif & diizinkan login)
    if (!user.is_active || !user.is_login_allowed) {
      return res.status(403).json({ success: false, message: 'User tidak aktif atau tidak diizinkan login' });
    }

    // ✅ Inject info user ke request (untuk digunakan di controller)
    req.user = {
      id: user.user_id,
      role: user.role,
      username: user.username,
      full_name: user.full_name
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
