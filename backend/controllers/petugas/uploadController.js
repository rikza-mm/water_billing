const cloudinary = require('../../config/cloudinary');
const { logger } = require('../../utils/logger');

const getCloudinarySignature = (req, res) => {
    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const folder = req.body.folder || 'default_uploads';

        // ✅ LANGKAH 1: Siapkan semua parameter yang akan ditandatangani
        const paramsToSign = {
            timestamp: timestamp,
            folder: folder,
        };

        // Jika ini adalah upload untuk struk (folder 'receipts'),
        // kita perlu menandatangani parameter tambahan ini juga.
        if (folder === 'receipts') {
            // paramsToSign.resource_type = 'raw'; // TIDAK perlu di-sign, endpoint sudah /raw/upload
            // paramsToSign.type = 'public'; // HAPUS, TIDAK didukung untuk RAW upload
        }
        
        // ✅ LANGKAH 2: Buat signature menggunakan semua parameter yang relevan
        const signature = cloudinary.utils.api_sign_request(
            paramsToSign, 
            process.env.CLOUDINARY_API_SECRET
        );

        // ✅ TAMBAHKAN: Log hanya di development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Cloudinary signature created', {
                folder,
                timestamp,
                userId: req.user?.id
            });
        }

        // ✅ LANGKAH 3: Kirim kembali SEMUA data yang dibutuhkan, termasuk signature
        res.status(200).json({ 
            success: true,
            // Semua parameter yang ditandatangani (kecuali secret) dikirim kembali
            params: paramsToSign, 
            signature: signature,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        });

    } catch (error) {
        // ✅ GANTI:  dengan logger.error
        logger.error('Cloudinary signature creation failed', {
            userId: req.user?.id,
            folder: req.body.folder,
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ success: false, message: 'Gagal membuat signature untuk upload.' });
    }
};

module.exports = {
    getCloudinarySignature
};