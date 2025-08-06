const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan folder untuk menyimpan file sementara
const uploadDir = path.join(__dirname, '../public/uploads');

// Buat folder jika belum ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Buat nama file yang unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meter-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB
});

// Ekspor middleware untuk menangani satu file dengan nama field 'meter_photo'
const uploadMeterPhoto = upload.single('meter_photo');
const uploadProofImage = upload.single('proof_image');

module.exports = { uploadMeterPhoto, uploadProofImage };