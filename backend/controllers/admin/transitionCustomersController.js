const { validationResult } = require('express-validator');
const Transition = require("../../models/admin/transitionCustomersModel.js");

exports.migrateCustomer = async (req, res) => {
    // ================== BLOK VALIDASI BARU ==================
    // Pastikan req.body ada dan bukan sekadar string atau null
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: "Request body tidak boleh kosong dan harus dalam format JSON."
        });
    }
    // =========================================================

    const requiredFields = [
        'fullName', 'areaId', 'categoryId', 'phoneNumber', 'address', 
        'registrationDate', 'meterNumber', 'lastMeterReading', 'lastReadingDate',
        'initialDebt', 'initialSaldo'
    ];

    for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
            return res.status(400).json({
                success: false,
                message: `Field yang dibutuhkan, '${field}', tidak ditemukan.`
            });
        }
    }

    const customerData = {
        fullName: req.body.fullName,
        areaId: req.body.areaId,
        categoryId: req.body.categoryId,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        registrationDate: req.body.registrationDate,
        meterNumber: req.body.meterNumber,
        lastMeterReading: req.body.lastMeterReading,
        lastReadingDate: req.body.lastReadingDate,
        initialDebt: req.body.initialDebt,
        initialSaldo: req.body.initialSaldo,
        notes: req.body.notes || 'Migrasi data dari sistem manual.',
        createdByUserId: req.user.id
    };

    try {
        const data = await Transition.migrateExisting(customerData);
        res.status(201).json(data);
    } catch (err) {
        const statusCode = err.message.includes("sudah terdaftar") ? 409 : 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Terjadi kesalahan saat proses migrasi pelanggan."
        });
    }
};

exports.transitionCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // ...existing code for transitioning customer...
};

exports.getTransitionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // ...existing code for getting transition by ID...
};