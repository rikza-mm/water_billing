const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AuthModel = require('../models/authModel');

class AuthController {
  // Register
  static async register(req, res) {
    try {
      const { username, full_name, password, role, phone_number } = req.body;

      if (!username || !full_name || !password || !role || !phone_number) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
      }

      const existingUser = await AuthModel.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username sudah digunakan' });
      }

      const userId = await AuthModel.register(req.body);

      res.status(201).json({
        message: 'Registrasi berhasil',
        userId
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Terjadi kesalahan saat registrasi',
        error: error.message 
      });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi' });
      }

      const user = await AuthModel.findUserByUsername(username);
      if (!user) {
        await AuthModel.createLoginLog(null, req.ip, req.headers['user-agent'], false);
        return res.status(401).json({ message: 'Username tidak ditemukan' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        await AuthModel.createLoginLog(user.user_id, req.ip, req.headers['user-agent'], false);
        return res.status(401).json({ message: 'Password salah' });
      }

      if (!user.is_active || !user.is_login_allowed) {
        return res.status(403).json({ message: 'Akun tidak aktif atau diblokir' });
      }

      const token = jwt.sign(
        { 
          id: user.user_id, 
          role: user.role,
          full_name: user.full_name // <-- TAMBAHKAN NAMA LENGKAP DI SINI
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } //SESI LOGIN AKTIF 24 JAM
      );

      await AuthModel.createLoginLog(user.user_id, req.ip, req.headers['user-agent'], true);

      res.status(200).json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.user_id,
          username: user.username,
          role: user.role,
          full_name: user.full_name
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Terjadi kesalahan saat login',
        error: error.message 
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      await AuthModel.createLogoutLog(req.user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ message: 'Logout berhasil' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Terjadi kesalahan saat logout',
        error: error.message 
      });
    }
  }
}

module.exports = AuthController;
