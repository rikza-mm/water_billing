const { validationResult } = require('express-validator');
const ProfileModel = require('../../models/admin/profileModel');

class ProfileController {

    /**
     * Mengambil semua data untuk Dasbor Profil Admin.
     */
    static async getAdminProfileDashboard(req, res) {
        try {
            const adminId = req.user.id; // Diambil dari token JWT

            const [
                profileInfo,
                activitySummary,
                activityLog
            ] = await Promise.all([
                ProfileModel.getProfileInfo(adminId),
                ProfileModel.getActivitySummary(adminId),
                ProfileModel.getActivityLog(adminId)
            ]);

            const responseData = {
                profileInfo,
                activitySummary,
                activityLog
            };

            res.status(200).json({ success: true, data: responseData });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data profil.' });
        }
    }

    /**
     * Menangani pembaruan profil.
     */
    static async updateProfile(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const adminId = req.user.id;
            const { full_name, phone_number, username } = req.body;

            if (!full_name || !phone_number || !username) {
                return res.status(400).json({ success: false, message: 'Nama lengkap, nomor telepon, dan username wajib diisi.' });
            }

            const success = await ProfileModel.updateProfile(adminId, { full_name, phone_number, username });
        
            if (success) {
                res.status(200).json({ success: true, message: 'Profil berhasil diperbarui. Silakan login kembali untuk melihat perubahan username.' });
            } else {
                // Ini jarang terjadi, tapi sebagai fallback
                throw new Error('Gagal memperbarui profil di database.');
         }
        } catch (error) {
            // Secara spesifik menangani error duplikasi username dari model
         if (error.message.includes('Username sudah digunakan')) {
              return res.status(409).json({ success: false, message: error.message });
         }
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Menangani perubahan password.
     */
    static async changePassword(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const adminId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
            }

            const success = await ProfileModel.changePassword(adminId, oldPassword, newPassword);
            if (success) {
                res.status(200).json({ success: true, message: 'Password berhasil diubah.' });
            } else {
                throw new Error('Gagal mengubah password.');
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ProfileController;