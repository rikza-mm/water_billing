const express = require('express');
const router = express.Router();
const uploadController = require('../../controllers/petugas/uploadController'); 
const authMiddleware = require('../../middleware/authMiddleware');
const { body } = require('express-validator');

// Rute ini hanya bisa diakses oleh user yang sudah login
router.post('/signature', [
  body('folder').optional().isString().trim().escape()
], authMiddleware, uploadController.getCloudinarySignature);

module.exports = router;