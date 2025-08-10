const { validationResult } = require('express-validator');
const Transition = require("../../models/admin/transitionCustomersModel.js");

exports.migrateCustomer = async (req, res) => {
    try {
        const {
            fullName, areaId, categoryId,
            phoneNumber, address, registrationDate,
            meterNumber, lastMeterReading, lastReadingDate,
            initialDebt, initialSaldo, notes
        } = req.body;
        const createdByUserId = req.user.id;

        // Treat empty phone as nullable
        const phone = (phoneNumber && String(phoneNumber).trim() !== '') ? phoneNumber.trim() : null;

        // Call SP via model
        const customerData = {
            fullName,
            areaId,
            categoryId,
            phoneNumber: phone,
            address,
            registrationDate,
            meterNumber,
            lastMeterReading,
            lastReadingDate,
            initialDebt,
            initialSaldo,
            notes: notes || 'Migrasi data dari sistem manual.',
            createdByUserId
        };

        const spResult = await Transition.migrateExisting(customerData);
        if (!spResult.success) {
            // Check for duplicate phone error
            const isPhoneDup = /telepon/i.test(spResult.message || '');
            return res.status(isPhoneDup ? 409 : 500).json(spResult);
        }
        return res.status(201).json(spResult);
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
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