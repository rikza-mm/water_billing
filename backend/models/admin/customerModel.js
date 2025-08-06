const pool = require('../../config/db');

/**
 * [FIXED] Mengambil daftar pelanggan dengan filter, paginasi, dan sorting.
 * Query sorting disesuaikan untuk menggunakan kolom 'name' dari view.
 */
const getFilteredCustomers = async (options) => {
    const { search, status, area, category, arrears, page, perPage, sortBy, sortOrder } = options;
    
    let baseQuery = `FROM v_customer_history_summary v`; 
    let whereConditions = [];
    let queryParams = [];

    // Filter Pencarian
    if (search) {
        whereConditions.push(`(v.name LIKE ? OR v.meterNumber LIKE ? OR v.id LIKE ?)`);
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (status && status !== 'all') {
        whereConditions.push(`v.status = ?`);
        queryParams.push(status);
    }
    
    if (area && area !== 'all') {
        whereConditions.push(`v.area_id = ?`);
        queryParams.push(area);
    }

    if (category && category !== 'all') {
        whereConditions.push(`v.id IN (SELECT customer_id FROM customers WHERE category_id = ?)`);
        queryParams.push(category);
    }

    if (arrears && arrears !== 'all') {
        switch(arrears) {
            case 'none': whereConditions.push(`v.hutang <= 0`); break;
            case '1_month': whereConditions.push(`v.unpaidBills = 1`); break;
            case '2_months_plus': whereConditions.push(`v.unpaidBills >= 2`); break;
        }
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const countSql = `SELECT COUNT(v.id) as total ${baseQuery} ${whereClause}`;
    const [countRows] = await pool.query(countSql, queryParams);
    const total = countRows[0].total;

    const offset = (page - 1) * perPage;
    // Menggunakan pool.escapeId untuk keamanan pada kolom sorting
    const dataSql = `SELECT v.* ${baseQuery} ${whereClause} ORDER BY ${pool.escapeId(sortBy)} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`;
    const finalParams = [...queryParams, perPage, offset];
    const [customers] = await pool.query(dataSql, finalParams);
    
    return {
        customers,
        pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage)
        }
    };
};

/**
 * [FIXED] Mengambil statistik ringkas untuk dasbor admin.
 */
const getSummaryStatistics = async () => {
    const [
        [activeCustomers],
        [newCustomers],
        [customersInArrears],
        [neverPaidCustomers],
        [topArea]
    ] = await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM customers WHERE status = 'active';"),
        pool.query("SELECT COUNT(*) as count FROM customers WHERE registration_date >= DATE_FORMAT(NOW(), '%Y-%m-01');"),
        pool.query("SELECT COUNT(*) as count FROM customers WHERE hutang > 0;"),
        pool.query("SELECT COUNT(c.customer_id) as count FROM customers c LEFT JOIN payments p ON c.customer_id = p.customer_id WHERE p.payment_id IS NULL;"),
        pool.query("SELECT a.area_name, COUNT(c.customer_id) as count FROM customers c JOIN areas a ON c.area_id = a.area_id GROUP BY a.area_id ORDER BY count DESC LIMIT 1;")
    ]);

    return {
        totalActiveCustomers: activeCustomers[0].count,
        newCustomersThisMonth: newCustomers[0].count,
        totalCustomersInArrears: customersInArrears[0].count,
        customersNeverPaid: neverPaidCustomers[0].count,
        topArea: topArea.length > 0 ? topArea[0] : { area_name: 'N/A', count: 0 }
    };
};

/**
 * [BARU] Mengambil semua data detail untuk satu pelanggan.
 * @param {number} customerId ID pelanggan yang dicari.
 */
const getDetailsById = async (customerId) => {
    try {
      // Jalankan semua query yang dibutuhkan secara paralel
      const [
        [profile],
        [billingHistory],
        [paymentHistory]
      ] = await Promise.all([
        // Query 1: Ambil info profil utama dari view
        pool.query('SELECT * FROM v_customer_history_summary WHERE id = ?', [customerId]),
        
        // Query 2: Ambil riwayat tagihan dari stored procedure
        pool.query('CALL GetCustomerBillingHistory(?)', [customerId]),
        
        // Query 3: Ambil 5 pembayaran terakhir
        pool.query('SELECT * FROM payments WHERE customer_id = ? ORDER BY transaction_date DESC LIMIT 5', [customerId])
      ]);
  
      if (!profile || profile.length === 0) {
        return null; // Pelanggan tidak ditemukan
      }
  
      return {
        profile: profile[0],
        billingHistory: billingHistory[0], // Stored procedure mengembalikan result set di dalam array
        paymentHistory: paymentHistory
      };
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * [BARU] Memperbarui data pelanggan.
   * @param {number} customerId ID pelanggan.
   * @param {object} dataToUpdate Data yang akan diperbarui.
   */
  const update = async (customerId, dataToUpdate) => {
    const [result] = await pool.query('UPDATE customers SET ? WHERE customer_id = ?', [dataToUpdate, customerId]);
    return result;
  };
  
  /**
   * [BARU] Memperbarui status seorang pelanggan.
   * @param {number} customerId ID pelanggan.
   * @param {string} status Status baru ('active', 'inactive', 'suspended').
   */
  const updateStatus = async (customerId, status) => {
    const [result] = await pool.query('UPDATE customers SET status = ? WHERE customer_id = ?', [status, customerId]);
    return result;
  };

/**
 * [BARU] Membuat customer baru (admin).
 * @param {object} data Data customer baru.
 * @returns {Promise<number>} customer_id yang baru dibuat
 */
const createCustomer = async (data) => {
  // Hanya kolom yang diizinkan
  const allowedFields = [
    'full_name', 'area_id', 'category_id', 'meter_number',
    'phone_number', 'address', 'status', 'registration_date', 'saldo', 'hutang'
  ];
  const insertData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) insertData[field] = data[field];
  });
  // Default value
  if (!insertData.status) insertData.status = 'active';
  if (!insertData.registration_date) insertData.registration_date = new Date();
  if (insertData.saldo === undefined) insertData.saldo = 0;
  if (insertData.hutang === undefined) insertData.hutang = 0;

  const [result] = await pool.query('INSERT INTO customers SET ?', [insertData]);
  return result.insertId;
};

/**
 * [BARU] Validasi apakah kategori ada dan valid.
 * @param {number} categoryId ID kategori yang akan divalidasi.
 * @returns {Promise<boolean>} true jika kategori valid, false jika tidak.
 */
const validateCategory = async (categoryId) => {
  try {
    const [rows] = await pool.query('SELECT category_id FROM customer_categories WHERE category_id = ?', [categoryId]);
    return rows.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * [BARU] Validasi apakah area ada dan valid.
 * @param {number} areaId ID area yang akan divalidasi.
 * @returns {Promise<boolean>} true jika area valid, false jika tidak.
 */
const validateArea = async (areaId) => {
  try {
    const [rows] = await pool.query('SELECT area_id FROM areas WHERE area_id = ?', [areaId]);
    return rows.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * [BARU] Mengambil daftar kategori pelanggan.
 * @returns {Promise<Array>} Array berisi daftar kategori.
 */
const getCategories = async () => {
  try {
    const [rows] = await pool.query('SELECT category_id, category_name FROM customer_categories ORDER BY category_name');
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * [BARU] Mengambil daftar area.
 * @returns {Promise<Array>} Array berisi daftar area.
 */
const getAreas = async () => {
  try {
    const [rows] = await pool.query('SELECT area_id, area_name FROM areas ORDER BY area_name');
    return rows;
  } catch (error) {
    throw error;
  }
};

// ✅ EKSPOR SEMUA FUNGSI SECARA BENAR
module.exports = {
    getFilteredCustomers,
    getSummaryStatistics,
    getDetailsById,
    update,
    updateStatus,
    createCustomer,
    validateCategory,
    validateArea,
    getCategories,
    getAreas
};