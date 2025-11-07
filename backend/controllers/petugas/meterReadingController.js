const pool = require('../../config/db');
const CustomerModel = require('../../models/petugas/customerModel');
const MeterReadingModel = require('../../models/petugas/meterReadingModel');
const BillModel = require('../../models/petugas/billModel');

// ✅ FUNGSI Mencatat pembacaan meter dan menghasilkan tagihan
exports.recordAndBill = async (req, res) => {
  try {
    // Ambil imageUrl langsung dari body, bukan dari req.file
    const { customerId, currentReading, readingDate, notes, imageUrl } = req.body;

    // Validasi data, sekarang TIDAK mewajibkan imageUrl
    if (!customerId || !currentReading || !readingDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data tidak lengkap. customerId, currentReading, dan readingDate wajib diisi.' 
      });
    }

    // Siapkan data untuk dikirim ke Stored Procedure
    const readingData = {
        customer_id: customerId,
        user_id: req.user.id,
        current_reading: parseFloat(currentReading),
        reading_date: readingDate,
        notes: notes || null,
        image_url: imageUrl || null, // Boleh null
    };

    // Panggil metode model yang memanggil Stored Procedure
    const result = await MeterReadingModel.createReadingAndBill(readingData);

    if (!result.success) {
      // Jika prosedur gagal, kirim pesan error dari prosedur
      return res.status(400).json(result);
    }
    
    // Kirim respons sukses
    res.status(201).json(result);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mencatat meter.', error: error.message });
  }
};

// ✅ Fungsi pembatalan pembacaan dan tagihan
exports.cancelReadingAndBill = async (req, res) => {
  try {
    const { billId } = req.body;
    const userId = req.user.id;

    if (!billId) {
      return res.status(400).json({ success: false, message: 'billId wajib diisi.' });
    }

    const result = await MeterReadingModel.cancelReadingAndBill(billId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada server.' });
  }
};

exports.validateReading = async (req, res) => {
  try {
    const { customer_id, current_reading, reading_date } = req.body;
    
    // Validasi input
    if (!customer_id || !current_reading) {
      return res.status(400).json({
        success: false,
        message: 'customer_id dan current_reading wajib diisi'
      });
    }
    
    // Verifikasi customer_id valid
    const customer = await CustomerModel.getCustomerById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Pelanggan dengan ID ${customer_id} tidak ditemukan`
      });
    }
    
    // Dapatkan pembacaan terakhir untuk pelanggan ini
    const lastReading = await MeterReadingModel.getLatestReading(customer_id);
    const previous_reading = lastReading ? parseFloat(lastReading.current_reading) : 0;
    
    // Validasi pembacaan baru harus lebih besar dari pembacaan sebelumnya
    if (parseFloat(current_reading) < previous_reading) {
      return res.status(400).json({
        success: false,
        message: 'Pembacaan baru tidak boleh lebih kecil dari pembacaan sebelumnya',
        data: {
          previous_reading,
          is_valid: false
        }
      });
    }
    
    // Hitung rata-rata pemakaian 3 bulan terakhir
    const avgUsage = await MeterReadingModel.getAverageUsage(customer_id);
    const newUsage = parseFloat(current_reading) - previous_reading;
    
    // Cek apakah pemakaian baru melebihi 3x rata-rata
    const isSuspicious = avgUsage > 0 && newUsage > (avgUsage * 3);
    
    res.json({
      success: true,
      message: 'Validasi pembacaan berhasil',
      data: {
        previous_reading,
        current_reading: parseFloat(current_reading),
        water_usage: newUsage,
        average_usage: avgUsage,
        is_valid: true,
        is_suspicious: isSuspicious,
        warning: isSuspicious ? 'Pemakaian air melebihi 3x rata-rata' : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memvalidasi pembacaan meter',
      error: error.message
    });
  }
};

exports.getReadingHistory = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'customer_id wajib diisi'
      });
    }
    
    const history = await MeterReadingModel.getReadingHistory(customer_id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat pembacaan meter',
      error: error.message
    });
  }
};

exports.syncOfflineReadings = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { readings } = req.body;
    const user_id = req.user.id;
    
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data pembacaan tidak valid'
      });
    }
    
    const results = [];
    
    for (const reading of readings) {
      const { customer_id, current_reading, reading_date, notes } = reading;
      
      // Dapatkan pembacaan terakhir untuk pelanggan ini
      const lastReading = await MeterReadingModel.getLatestReading(customer_id, connection);
      const previous_reading = lastReading ? parseFloat(lastReading.current_reading) : 0;
      
      // Validasi pembacaan baru harus lebih besar dari pembacaan sebelumnya
      if (parseFloat(current_reading) < previous_reading) {
        results.push({
          customer_id,
          status: 'failed',
          message: 'Pembacaan baru tidak boleh lebih kecil dari pembacaan sebelumnya'
        });
        continue;
      }
      
      // Siapkan data pembacaan
      const readingData = {
        customer_id: parseInt(customer_id),
        user_id,
        previous_reading,
        current_reading: parseFloat(current_reading),
        reading_date,
        sync_status: 'offline_synced',
        notes: notes || null
      };
      
      // Simpan pembacaan meter
      const reading_id = await MeterReadingModel.create(readingData, connection);
      
      // Ambil rate_id terbaru
      const rateId = await MeterReadingModel.getLatestRateId(connection);
      
      // Tentukan period_start dan period_end (bulan ini)
      const readingDateObj = new Date(reading_date);
      const periodStart = new Date(readingDateObj.getFullYear(), readingDateObj.getMonth(), 1);
      const periodEnd = new Date(readingDateObj.getFullYear(), readingDateObj.getMonth() + 1, 0);
      
      // Hitung due_date (15 hari setelah period_end)
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + 15);
      
      // Buat tagihan baru
      const billData = {
        customer_id: parseInt(customer_id),
        reading_id,
        rate_id: rateId,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: 'unpaid'
      };
      
      const bill_id = await BillModel.create(billData, connection);
      
      results.push({
        customer_id,
        reading_id,
        bill_id,
        status: 'success',
        message: 'Pembacaan meter berhasil disinkronkan'
      });
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: `${results.filter(r => r.status === 'success').length} dari ${readings.length} pembacaan berhasil disinkronkan`,
      data: results
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyinkronkan pembacaan offline',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.addReadingFlag = async (req, res) => {
  try {
    const { reading_id, flag_type, flag_value, notes } = req.body;
    const user_id = req.user.id;
    
    if (!reading_id || !flag_type) {
      return res.status(400).json({
        success: false,
        message: 'reading_id dan flag_type wajib diisi'
      });
    }
    
    // Verifikasi reading_id valid
    const reading = await MeterReadingModel.getReadingById(reading_id);
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: `Pembacaan dengan ID ${reading_id} tidak ditemukan`
      });
    }
    
    const flag_id = await MeterReadingModel.addFlag(
      reading_id,
      flag_type,
      flag_value || null,
      notes || null,
      user_id
    );
    
    res.status(201).json({
      success: true,
      message: 'Flag berhasil ditambahkan',
      data: { flag_id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan flag',
      error: error.message
    });
  }
};
