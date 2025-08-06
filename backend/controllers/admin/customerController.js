const adminCustomerModel = require('../../models/admin/customerModel');
const pool = require('../../config/db');
const { createCustomer } = require('../../models/admin/customerModel');
const { validationResult } = require('express-validator');

// ✅ FUNGSI getCustomersAndStats DIPERBAIKI
exports.getCustomersAndStats = async (req, res) => {
    try {
        const options = {
            search: req.query.search || '',
            status: req.query.status || 'all',
            area: req.query.area || 'all',
            category: req.query.category || 'all',
            arrears: req.query.arrears || 'all',
            page: parseInt(req.query.page) || 1,
            perPage: parseInt(req.query.perPage) || 10,
            // PERBAIKAN: Default sorting sekarang menggunakan 'name' bukan 'full_name'
            sortBy: req.query.sortBy || 'name', 
            sortOrder: req.query.sortOrder || 'ASC'
        };

        const [customerData, statsData] = await Promise.all([
            adminCustomerModel.getFilteredCustomers(options),
            adminCustomerModel.getSummaryStatistics()
        ]);

        res.status(200).json({
            success: true,
            data: {
                customers: customerData.customers,
                pagination: customerData.pagination,
                summaryStats: statsData
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * [DIPERBAIKI] Mengambil detail lengkap seorang pelanggan.
 */
exports.getCustomerDetails = async (req, res) => {
    try {
        const customerId = req.params.id;
        const customerDetails = await adminCustomerModel.getDetailsById(customerId);

        if (!customerDetails) {
            return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
        }

        res.status(200).json({
            success: true,
            data: customerDetails
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * [DIPERBAIKI] Mengedit data pelanggan dengan validasi dan dukungan kategori.
 */
exports.updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const customerId = req.params.id;
        const body = req.body;

        // 1. Keamanan: Definisikan kolom apa saja yang boleh diubah oleh admin
        const allowedUpdates = [
            'full_name', 
            'phone_number', 
            'whatsapp_number', 
            'address', 
            'area_id', 
            'category_id', 
            'meter_number'
        ];
        
        const dataToUpdate = {};
        // Filter body request, hanya ambil data yang diizinkan
        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key) && body[key] !== null && body[key] !== undefined) {
                dataToUpdate[key] = body[key];
            }
        });

        // 2. Validasi: Pastikan ada data yang valid untuk diperbarui
        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tidak ada data valid yang dikirim untuk diperbarui.' 
            });
        }

        // 3. Validasi tambahan untuk category_id jika ada
        if (dataToUpdate.category_id) {
            const categoryExists = await adminCustomerModel.validateCategory(dataToUpdate.category_id);
            if (!categoryExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Kategori yang dipilih tidak valid atau tidak ditemukan.' 
                });
            }
        }

        // 4. Validasi tambahan untuk area_id jika ada
        if (dataToUpdate.area_id) {
            const areaExists = await adminCustomerModel.validateArea(dataToUpdate.area_id);
            if (!areaExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Area yang dipilih tidak valid atau tidak ditemukan.' 
                });
            }
        }

        const updateResult = await adminCustomerModel.update(customerId, dataToUpdate);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pelanggan tidak ditemukan, pembaruan gagal.' 
            });
        }

        // 5. Respons Informatif: Ambil data terbaru setelah di-update
        const updatedCustomer = await adminCustomerModel.getDetailsById(customerId);

        res.status(200).json({
            success: true,
            message: 'Data pelanggan berhasil diperbarui.',
            data: updatedCustomer
        });

    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                success: false, 
                message: 'Update gagal: ID Area atau ID Kategori yang dimasukkan tidak valid.' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

/**
 * [BARU] Mengubah status pelanggan.
 */
exports.updateCustomerStatus = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const customerId = req.params.id;
        const { status } = req.body;

        const allowedStatuses = ['active', 'inactive', 'suspended'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Status tidak valid. Gunakan: ${allowedStatuses.join(', ')}` 
            });
        }
        
        await adminCustomerModel.updateStatus(customerId, status);
        
        res.status(200).json({
            success: true,
            message: `Status pelanggan berhasil diubah menjadi '${status}'.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * [BARU] Membuat customer baru (admin)
 * @route POST /api/v1/admin/customers
 */
exports.createCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const {
            full_name, area_id, category_id, meter_number,
            phone_number, address, status, registration_date
        } = req.body;

        // Validasi field utama
        if (!full_name || !area_id || !phone_number || !address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nama, area, nomor telepon, dan alamat wajib diisi.' 
            });
        }

        // Validasi category_id jika ada
        if (category_id) {
            const categoryExists = await adminCustomerModel.validateCategory(category_id);
            if (!categoryExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Kategori yang dipilih tidak valid atau tidak ditemukan.' 
                });
            }
        }

        // Validasi area_id
        const areaExists = await adminCustomerModel.validateArea(area_id);
        if (!areaExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Area yang dipilih tidak valid atau tidak ditemukan.' 
            });
        }

        // Siapkan data insert
        const data = {
            full_name,
            area_id,
            category_id: category_id || null,
            meter_number: meter_number || null,
            phone_number,
            address,
            status: status || 'active',
            registration_date: registration_date || new Date(),
            saldo: 0,
            hutang: 0
        };

        const newCustomerId = await createCustomer(data);
        // Ambil detail customer baru
        const newCustomer = await adminCustomerModel.getDetailsById(newCustomerId);
        res.status(201).json({
            success: true,
            message: 'Customer berhasil ditambahkan',
            data: newCustomer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

/**
 * [BARU] Mengambil daftar kategori pelanggan.
 * @route GET /api/v1/admin/customers/categories/list
 */
exports.getCategories = async (req, res) => {
    try {
        const categories = await adminCustomerModel.getCategories();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * [BARU] Mengambil daftar area.
 * @route GET /api/v1/admin/customers/areas/list
 */
exports.getAreas = async (req, res) => {
    try {
        const areas = await adminCustomerModel.getAreas();
        res.status(200).json({
            success: true,
            data: areas
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};