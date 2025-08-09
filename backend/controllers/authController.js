const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AuthModel = require('../models/authModel');
const { logInfo, logWarn, logError } = require('../utils/logger');

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
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
      }

      const user = await AuthModel.findUserByUsername(username);

      if (!user) {
        logWarn('Upaya login gagal: Username tidak ditemukan', { username, ipAddress });
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        await AuthModel.createLoginLog(user.user_id, ipAddress, userAgent, false);
        logWarn('Upaya login gagal: Password salah', { username, ipAddress });
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
      }

      if (!user.is_active || !user.is_login_allowed) {
        return res.status(403).json({ message: 'Akun tidak aktif atau diblokir' });
      }

      const token = jwt.sign(
        { 
          id: user.user_id, 
          role: user.role,
          full_name: user.full_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await AuthModel.createLoginLog(user.user_id, ipAddress, userAgent, true);
      logInfo('Login berhasil', { username: user.username, role: user.role, ipAddress });

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
      logError('Error saat proses login', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        message: 'Terjadi kesalahan internal pada server.'
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
