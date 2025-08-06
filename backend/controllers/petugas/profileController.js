const profileModel = require('../../models/petugas/profileModel');

/**
 * Mengambil profil lengkap dari petugas yang sedang login.
 */
const getMyProfile = async (req, res) => {
  try {
    // ID user diambil dari token yang sudah divalidasi oleh authMiddleware
    const userId = req.user.id;

    const profileData = await profileModel.getProfileById(userId);

    if (!profileData) {
      return res.status(404).json({
        success: false,
        message: 'Profil petugas tidak ditemukan.'
      });
    }

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil data profil.'
    });
  }
};

module.exports = {
  getMyProfile,
};