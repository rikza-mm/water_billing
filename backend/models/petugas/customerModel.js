const pool = require('../../config/db');
const { addAreaFilter } = require('../../middleware/areaRestrictionMiddleware');

const getCustomers = async (search, status, usage, offset, limit, userAreaIds = null) => {
  try {
    let baseQuery = `
      SELECT
        c.customer_id as id,
        c.full_name as name,
        c.meter_number as meterNumber,
        c.phone_number as phone,
        c.address,
        c.status,
        c.saldo,
        c.hutang,
        c.area_id,
        a.area_name as area,
        c.category_id,
        cc.category_name,
        COALESCE(mr.current_reading, 0) as lastReading,
        mr.reading_date as lastReadingDate,
        COALESCE(avg_mr.avg_usage, 0) as averageUsage
      FROM customers c
      LEFT JOIN areas a ON c.area_id = a.area_id
      LEFT JOIN customer_categories cc ON c.category_id = cc.category_id
      LEFT JOIN (
        SELECT
          customer_id,
          current_reading,
          reading_date 
        FROM meter_readings mr1
        WHERE reading_date = (
          SELECT MAX(reading_date)
          FROM meter_readings mr2
          WHERE mr2.customer_id = mr1.customer_id
          AND mr2.deleted_at IS NULL
        )
      ) mr ON c.customer_id = mr.customer_id
      LEFT JOIN (
        SELECT
          customer_id,
          AVG(water_usage) as avg_usage
        FROM meter_readings
        WHERE reading_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        AND deleted_at IS NULL
        GROUP BY customer_id
      ) avg_mr ON c.customer_id = avg_mr.customer_id
    `;

    let whereConditions = [];
    let queryParams = [];

    // ✅ AREA RESTRICTION: Filter berdasarkan area yang ditugaskan ke petugas
    if (userAreaIds && userAreaIds.length > 0) {
      const result = addAreaFilter(baseQuery, whereConditions, queryParams, userAreaIds);
      whereConditions = result.whereConditions;
      queryParams = result.queryParams;
    }

    // Tambahkan kondisi pencarian
    if (search && search.trim() !== '') {
      whereConditions.push(`(
        c.full_name LIKE ? OR
        c.meter_number LIKE ? OR
        c.phone_number LIKE ? OR
        c.address LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Tambahkan filter status
    if (status && status !== 'all') {
      whereConditions.push('c.status = ?');
      queryParams.push(status);
    }

    // Tambahkan filter penggunaan air
    if (usage && usage !== 'all') {
      switch(usage) {
        case 'high':
          whereConditions.push('avg_mr.avg_usage > 20');
          break;
        case 'medium':
          whereConditions.push('avg_mr.avg_usage BETWEEN 10 AND 20');
          break;
        case 'low':
          whereConditions.push('avg_mr.avg_usage < 10');
          break;
      }
    }

    // Gabungkan WHERE conditions jika ada
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Hitung total records untuk pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_table`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Tambahkan ORDER BY dan LIMIT untuk pagination
    baseQuery += ` ORDER BY c.full_name LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Execute query utama
    const [customers] = await pool.execute(baseQuery, queryParams);

    // ✅ TAMBAHKAN: Deduplikasi berdasarkan customer_id
    const uniqueCustomers = customers.filter((customer, index, self) => 
      index === self.findIndex(c => c.customer_id === customer.customer_id)
    );

    // Format hasil
    const formattedCustomers = uniqueCustomers.map(customer => ({
      ...customer,
      saldo: parseFloat(customer.saldo || 0).toFixed(2),
      hutang: parseFloat(customer.hutang || 0).toFixed(2),
      lastReading: parseFloat(customer.lastReading || 0).toFixed(2),
      averageUsage: parseFloat(customer.averageUsage || 0).toFixed(2),
      meterNumber: String(customer.meterNumber || '').padStart(5, '0')
    }));

    return {
      customers: formattedCustomers,
      total: formattedCustomers.length // ✅ PERBAIKI: Gunakan length yang sudah di-deduplikasi
    };
  } catch (error) {
    throw error;
  }
};

const findById = async (customerId, userAreaIds = null) => {
  const conn = pool;
  try {
    let query = `
      SELECT
        c.customer_id as id,
        c.full_name as name,
        c.meter_number as meterNumber,
        c.phone_number as phone,
        c.address,
        c.status,
        c.saldo,
        c.hutang,
        c.area_id,
        a.area_name as area,
        c.category_id,
        cc.category_name,
        COALESCE(mr.current_reading, 0) as lastReading,
        mr.reading_date as lastReadingDate
      FROM customers c
      LEFT JOIN areas a ON c.area_id = a.area_id
      LEFT JOIN customer_categories cc ON c.category_id = cc.category_id
      LEFT JOIN meter_readings mr ON mr.reading_id = (
          SELECT reading_id FROM meter_readings 
          WHERE customer_id = c.customer_id
          AND deleted_at IS NULL 
          ORDER BY reading_date DESC, reading_id DESC 
          LIMIT 1
      )
      WHERE c.customer_id = ?
    `;

    const queryParams = [customerId];

    if (userAreaIds && userAreaIds.length > 0) {
      const placeholders = userAreaIds.map(() => '?').join(',');
      query += ` AND c.area_id IN (${placeholders})`;
      queryParams.push(...userAreaIds);
    }

    const [rows] = await conn.execute(query, queryParams);

    if (rows.length > 0) {
      const customer = rows[0];
      // Formatting agar konsisten dengan getCustomers
      return {
        ...customer,
        saldo: parseFloat(customer.saldo || 0).toFixed(2),
        hutang: parseFloat(customer.hutang || 0).toFixed(2),
        lastReading: parseFloat(customer.lastReading || 0).toFixed(2),
        meterNumber: String(customer.meterNumber || '').padStart(5, '0')
      };
    }
    return null;

  } catch (error) {
    throw error;
  }
};
//update/imput nomor WA pelanggan untuk kirim struk
const updatePhoneNumber = async (customerId, phoneNumber) => {
  try {
    await pool.execute('CALL UpdateCustomerPhoneNumber(?, ?)', [customerId, phoneNumber]);
    return { success: true, message: 'Nomor telepon berhasil diperbarui.' };
  } catch (error) {
    throw new Error(error.message || 'Gagal memperbarui nomor di database.');
  }
};


module.exports = {
  getCustomers,
  findById,
  updatePhoneNumber,
  searchCustomers: getCustomers, // Alias untuk kompatibilitas
};