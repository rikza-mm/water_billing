const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    //('🔍 roleMiddleware | Data user:', req.user); // Debug log

    // Pastikan req.user ada
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi',
      });
    }

    // Periksa apakah role user diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Role tidak diizinkan',
      });
    }

    // Lanjut ke controller
    next();
  };
};

module.exports = roleMiddleware;