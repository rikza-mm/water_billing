const SettingsModel = require('../../models/admin/settingsModel');
const { validationResult } = require('express-validator');

exports.getSettings = async (req, res) => {
    try {
        const settingsArray = await SettingsModel.getAll();
        // Ubah array menjadi objek agar mudah digunakan di frontend
        const settingsObject = settingsArray.reduce((obj, item) => {
            obj[item.setting_key] = item.setting_value;
            return obj;
        }, {});
        res.json({ success: true, data: settingsObject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan.' });
    }
};

exports.updateSettings = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const settings = req.body; // Menerima objek berisi pengaturan
        for (const key in settings) {
            await SettingsModel.update(key, settings[key]);
        }
        res.json({ success: true, message: 'Pengaturan berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan.' });
    }
};