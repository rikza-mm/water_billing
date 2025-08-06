const pool = require('../../config/db');
const PaymentModel = require('../../models/petugas/PaymentModel');
const BillModel = require('../../models/petugas/billModel');
const CustomerModel = require('../../models/petugas/customerModel');

// --- FUNGSI UNTUK PEMBAYARAN TAGIHAN TUNGGAL (VERSI BARU) ---
const createPayment = async (req, res) => {
    try {
        // ✅ Ambil proofUrl langsung dari req.body
        const { bill_id, amount, method, use_balance, proofUrl } = req.body;

        // Validasi dasar
        if (!bill_id || !amount || !method) {
            return res.status(400).json({ success: false, message: 'Data pembayaran tidak lengkap.' });
        }
        
        // Validasi jika metode non-tunai, URL bukti wajib ada
        if ((method === 'transfer' || method === 'qris') && !proofUrl) {
            return res.status(400).json({ success: false, message: 'URL bukti pembayaran wajib disertakan untuk metode ini.' });
        }

        // Siapkan data untuk dikirim ke Stored Procedure
        const paymentData = {
            p_bill_id: bill_id,
            p_user_id: req.user.id,
            p_amount_paid: parseFloat(amount),
            p_method: method,
            p_use_balance: use_balance,
            p_proof_url: proofUrl || null // Gunakan URL dari frontend
        };

        const transactionResult = await PaymentModel.processSinglePayment(paymentData);
        
        if (!transactionResult.success) {
            return res.status(400).json(transactionResult);
        }
        
        // Kirim kembali respons yang kaya informasi
        res.status(201).json({ 
            success: true,
            message: transactionResult.message,
            data: {
                ...transactionResult,
                officerName: req.user.full_name,
                proofUrl: proofUrl
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memproses pembayaran.', error: error.message });
    }
};

// --- FUNGSI UNTUK PEMBAYARAN HUTANG (VERSI BARU) ---
const payDebt = async (req, res) => {
    try {
        // ✅ Ambil proofUrl langsung dari req.body
        const { customer_id, amount, method, proofUrl } = req.body;

        // Validasi dasar
        if (!customer_id || !amount || !method) {
            return res.status(400).json({ success: false, message: 'Data pembayaran hutang tidak lengkap.' });
        }

        if ((method === 'transfer' || method === 'qris') && !proofUrl) {
            return res.status(400).json({ success: false, message: 'URL bukti pembayaran wajib disertakan.' });
        }

        const debtPaymentData = {
            p_customer_id: customer_id,
            p_amount: parseFloat(amount),
            p_method: method,
            p_user_id: req.user.id,
            p_proof_url: proofUrl || null
        };

        const result = await PaymentModel.processDebtPayment(debtPaymentData);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        // Kirim kembali respons yang kaya informasi
        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                ...result,
                officerName: req.user.full_name,
                proofUrl: proofUrl
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memproses pembayaran hutang.', error: error.message });
    }
};


/**
 * Logika untuk menambah saldo (deposit) secara manual.
 */
const createDeposit = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { customer_id } = req.params;
        const { amount, method } = req.body;
        const user_id = req.user.id;

        if (!customer_id || !amount || parseFloat(amount) <= 0 || !method) {
            return res.status(400).json({ success: false, message: "Customer ID, jumlah positif, dan metode wajib diisi." });
        }

        // Langsung panggil Stored Procedure untuk deposit
        await connection.query('CALL ProcessDeposit(?, ?, ?, ?, @result)', [customer_id, user_id, parseFloat(amount), method]);
        const [resultRows] = await connection.query('SELECT @result as result');
        const procedureResult = JSON.parse(resultRows[0].result);

        if (!procedureResult.success) {
            throw new Error(procedureResult.message);
        }

        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            message: `Saldo berhasil ditambahkan.`, 
            data: { paymentId: procedureResult.paymentId } 
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Gagal menambah saldo.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Logika untuk mendapatkan preview pembayaran.
 */
const getPaymentPreview = async (req, res) => {
    try {
        const { customer_id, bill_id, amount, use_balance = 'true', priority = 'current_first' } = req.query;
        if (!customer_id || (amount === undefined || amount === null)) {
            return res.status(400).json({ success: false, message: 'Customer ID dan amount wajib diisi.' });
        }
        
        const params = {
            p_customer_id: parseInt(customer_id),
            p_bill_id: bill_id ? parseInt(bill_id) : null,
            p_amount: parseFloat(amount),
            p_use_balance: use_balance === 'true',
            p_priority: priority
        };
        
        const simulationResult = await PaymentModel.getSimulationFromDB(params);
        if (!simulationResult) {
            throw new Error("Gagal mendapatkan simulasi dari database.");
        }
        
        res.status(200).json({ success: true, message: 'Simulasi berhasil dihitung.', data: simulationResult });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghitung preview pembayaran.', error: error.message });
    }
};

/**
 * Logika untuk mengambil riwayat pembayaran pelanggan.
 */
const getPaymentHistory = async (req, res) => {
    try {
        const { customer_id } = req.params;
        const history = await PaymentModel.getHistoryByCustomer(customer_id);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pembayaran.', error: error.message });
    }
};

/**
 * Logika untuk mengambil riwayat pembayaran hutang pelanggan.
 */
const getDebtPaymentHistory = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const history = await PaymentModel.getDebtPaymentHistory(customer_id);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat pembayaran hutang.',
      error: error.message
    });
  }
};

// Fungsi placeholder yang belum diimplementasikan
const getPaymentDetails = async (req, res) => {
    res.status(501).json({ message: 'Belum diimplementasikan' });
};

const getPaymentRecommendations = async (req, res) => {
    res.status(501).json({ message: 'Belum diimplementasikan' });
};

// Ekspor semua fungsi agar bisa digunakan oleh rute
module.exports = {
    createPayment,
    payDebt,
    createDeposit,
    getPaymentPreview,
    getPaymentHistory,
    getPaymentDetails,
    getPaymentRecommendations,
    getDebtPaymentHistory,
};