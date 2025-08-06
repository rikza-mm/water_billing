const pool = require('../../config/db');
const HistoryModel = require('../../models/petugas/historyModel'); 

// Mendapatkan data riwayat dengan filter dan pagination
exports.getHistories = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      startDate,
      endDate,
      paymentStatus,
      area,
      period,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Base query untuk mendapatkan riwayat pelanggan
    let baseQuery = `
      FROM customers c
      LEFT JOIN bills b ON c.customer_id = b.customer_id
      LEFT JOIN payments p ON b.bill_id = p.bill_id
      LEFT JOIN meter_readings mr ON b.reading_id = mr.reading_id
      LEFT JOIN areas a ON c.area_id = a.area_id
      LEFT JOIN users u ON mr.user_id = u.user_id
      WHERE 1=1
    `;

    // ✅ AREA RESTRICTION: Filter berdasarkan area yang ditugaskan ke petugas
    if (req.user?.assignedAreaIds && req.user.assignedAreaIds.length > 0) {
      const placeholders = req.user.assignedAreaIds.map(() => '?').join(',');
      baseQuery += ` AND c.area_id IN (${placeholders})`;
    }

    let whereConditions = [];
    let queryParams = [];

    // ✅ AREA RESTRICTION: Tambahkan area IDs ke query params jika ada
    if (req.user?.assignedAreaIds && req.user.assignedAreaIds.length > 0) {
      queryParams.push(...req.user.assignedAreaIds);
    }

    // Filter berdasarkan customer ID
    if (customerId) {
      whereConditions.push('c.customer_id = ?');
      queryParams.push(customerId);
    }

    // Filter berdasarkan nama pelanggan
    if (customerName) {
      whereConditions.push('c.full_name LIKE ?');
      queryParams.push(`%${customerName}%`);
    }

    // Filter berdasarkan tanggal
    if (startDate) {
      whereConditions.push('DATE(b.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(b.created_at) <= ?');
      queryParams.push(endDate);
    }

    // Filter berdasarkan status pembayaran
    if (paymentStatus && paymentStatus !== 'all') {
      if (paymentStatus === 'paid') {
        whereConditions.push('b.status = "paid"');
      } else if (paymentStatus === 'unpaid') {
        whereConditions.push('b.status = "unpaid"');
      }
    }

    // Filter berdasarkan area
    if (area) {
      whereConditions.push('a.area_name = ?');
      queryParams.push(area);
    }

    // Filter berdasarkan periode
    if (period) {
      whereConditions.push('DATE_FORMAT(b.period_end, "%Y-%m") = ?');
      queryParams.push(period);
    }

    // Gabungkan kondisi WHERE
    if (whereConditions.length > 0) {
      baseQuery += ' AND ' + whereConditions.join(' AND ');
    }

    // Query untuk mendapatkan data histories
    const historiesQuery = `
      SELECT DISTINCT
        c.customer_id as id,
        c.full_name as name,
        c.address,
        a.area_name as area,
        c.phone_number as phoneNumber,
        COALESCE(MAX(mr.current_reading), 0) as lastReading,
        COALESCE(MAX(mr.reading_date), '') as lastReadingDate,
        COALESCE(SUM(mr.water_usage), 0) as totalUsage,
        COUNT(DISTINCT b.bill_id) as totalBills,
        COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN b.bill_id END) as paidBills,
        COUNT(DISTINCT CASE WHEN b.status = 'unpaid' THEN b.bill_id END) as unpaidBills,
        COALESCE(AVG(mr.water_usage), 0) as averageUsage,
        CASE
          WHEN COUNT(DISTINCT CASE WHEN b.status = 'unpaid' THEN b.bill_id END) > 0 THEN 'unpaid'
          WHEN COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN b.bill_id END) > 0 THEN 'paid'
          ELSE 'partial'
        END as paymentStatus,
        MAX(p.transaction_date) as lastPaymentDate,
        MAX(p.method) as lastPaymentMethod,
        MAX(u.full_name) as officerName,
        MAX(mr.notes) as notes
      ${baseQuery}
      GROUP BY c.customer_id, c.full_name, c.address, a.area_name, c.phone_number
      ORDER BY c.customer_id DESC
      LIMIT ? OFFSET ?
    `;

    // Query untuk menghitung total items
    const countQuery = `
      SELECT COUNT(DISTINCT c.customer_id) as total
      ${baseQuery}
    `;

    // Eksekusi query
    const [histories] = await pool.execute(historiesQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    // Konversi data numerik untuk memastikan format yang benar
    const formattedHistories = histories.map(history => ({
      ...history,
      lastReading: Number(history.lastReading || 0),
      totalUsage: Number(history.totalUsage || 0),
      totalBills: Number(history.totalBills || 0),
      paidBills: Number(history.paidBills || 0),
      unpaidBills: Number(history.unpaidBills || 0),
      averageUsage: Number(history.averageUsage || 0)
    }));

    // Query untuk summary
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT mr.reading_id) as totalReadings,
        COUNT(DISTINCT CASE WHEN b.status = 'unpaid' THEN c.customer_id END) as totalUnpaidCustomers,
        COUNT(DISTINCT CASE WHEN c.saldo > 0 THEN c.customer_id END) as customersWithBalance,
        COALESCE(SUM(CASE WHEN b.status = 'unpaid' THEN b.amount ELSE 0 END), 0) as totalUnpaidAmount,
        COALESCE(AVG(DATEDIFF(CURDATE(), b.due_date)), 0) as averageDelay,
        COUNT(DISTINCT CASE WHEN b.status = 'unpaid' AND DATEDIFF(CURDATE(), b.due_date) > 30 THEN c.customer_id END) as problematicCustomers,
        COUNT(DISTINCT CASE WHEN MONTH(mr.reading_date) = MONTH(CURDATE()) AND YEAR(mr.reading_date) = YEAR(CURDATE()) THEN mr.reading_id END) as currentMonthReadings,
        COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) as totalRevenue
      ${baseQuery}
    `;

    const [summaryResult] = await pool.execute(summaryQuery, queryParams);
    const summary = summaryResult[0];

    res.json({
      success: true,
      data: {
        histories: formattedHistories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        summary
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data riwayat',
      error: error.message
    });
  }
};

// Mendapatkan detail riwayat untuk pelanggan tertentu
exports.getDetailedHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID wajib diisi' });
    }

    // 2. Panggil kedua metode dari model secara paralel untuk efisiensi
    const [detailedHistory, customerSummary] = await Promise.all([
      HistoryModel.getDetailedBillingHistory(customerId),
      HistoryModel.getFinancialSummary(customerId)
    ]);
    
    if (!customerSummary) {
        return res.status(404).json({ success: false, message: 'Data pelanggan tidak ditemukan.' });
    }

    // 3. Gabungkan hasil dan kirim sebagai respons
    res.json({
      success: true,
      data: {
        history: detailedHistory || [], // Kirim array kosong jika tidak ada riwayat
        summary: customerSummary
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail riwayat',
      error: error.message
    });
  }
};

// Mendapatkan riwayat pembayaran hutang dari seorang pelanggan
exports.getDebtPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer ID wajib diisi.' });
    }

    // Panggil metode model seperti biasa
    const debtHistoryData = await HistoryModel.getDebtPaymentHistory(customerId);
    
    // ✅ PERBAIKAN: Lakukan parsing pada properti 'allocations'
    const formattedData = debtHistoryData.map(payment => {
      try {
        // Cek jika allocations adalah string, lalu parse. Jika sudah array, biarkan.
        const allocations = typeof payment.allocations === 'string' 
          ? JSON.parse(payment.allocations) 
          : payment.allocations || [];
        
        return {
          ...payment,
          allocations: allocations
        };
      } catch (e) {
        // Jika parsing gagal, kembalikan array kosong untuk mencegah crash
        return {
          ...payment,
          allocations: []
        };
      }
    });
    
    // Kirim data yang sudah rapi dan terstruktur ke frontend
    res.json({ success: true, data: formattedData });

  } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pembayaran hutang.' });
  }
};


// Mengekspor data riwayat (placeholder untuk implementasi export)
exports.exportHistory = async (req, res) => {
  try {
    const { format = 'excel' } = req.query;

    // Untuk sementara, return error karena export belum diimplementasikan
    res.status(501).json({
      success: false,
      message: 'Fitur export belum diimplementasikan'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengekspor data',
      error: error.message
    });
  }
};

// Mendapatkan daftar area untuk filter
exports.getAreas = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT area_name as name
      FROM areas
      WHERE area_name IS NOT NULL
      ORDER BY area_name
    `;

    const [areas] = await pool.execute(query);

    res.json({
      success: true,
      data: areas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data area',
      error: error.message
    });
  }
};
