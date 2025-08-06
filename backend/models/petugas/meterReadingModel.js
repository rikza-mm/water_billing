const pool = require('../../config/db');

class MeterReadingModel {

 /**
   * ✅ METODE DIPERBARUI: Memanggil Stored Procedure `CreateBillFromReading_v2`
   * yang sudah mendukung tarif dinamis dan upload gambar.
   * @param {object} readingData - Data pembacaan dari controller.
   * @returns {Promise<object>} - Hasil dari stored procedure.
   */
 static async createReadingAndBill(readingData) {
  // Data yang dibutuhkan oleh prosedur v2
  const { customer_id, user_id, current_reading, reading_date, notes, image_url } = readingData;
  const connection = await pool.getConnection();
  
  try {
    // Panggil prosedur v2 yang benar dengan 6 parameter input
    await connection.query(
      'CALL CreateBillFromReading_v2(?, ?, ?, ?, ?, ?, @result);', 
      [
        customer_id, 
        user_id, 
        current_reading, 
        reading_date, 
        notes || null, 
        image_url || null
      ]
    );
    
    const [resultRows] = await connection.query('SELECT @result AS result;');

    if (!resultRows || !resultRows[0].result) {
      throw new Error('Prosedur CreateBillFromReading_v2 tidak mengembalikan hasil.');
    }
    return JSON.parse(resultRows[0].result);

  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
   * ✅ METODE BARU: Memanggil prosedur untuk membatalkan Reading & Bill.
   */
  static async cancelReadingAndBill(billId, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.query('CALL CancelReadingAndBill(?, ?, @result);', [billId, userId]);
      const [resultRows] = await connection.query('SELECT @result AS result;');
      if (!resultRows || !resultRows[0].result) {
          throw new Error('Prosedur CancelReadingAndBill tidak mengembalikan hasil.');
      }
      return JSON.parse(resultRows[0].result);
    } catch (error) {
      throw error;
    } finally {
        if (connection) connection.release();
    }
  }

  static async getLatestReading(customerId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(
      `SELECT 
        reading_id,
        current_reading,
        reading_date
       FROM meter_readings 
       WHERE customer_id = ?
       AND deleted_at IS NULL
       ORDER BY reading_date DESC
       LIMIT 1`,
      [customerId]
    );
    
    return rows[0];
  }
  
  static async create(readingData, connection) {
    const conn = connection || pool;
    
    const {
      customer_id,
      user_id,
      previous_reading,
      current_reading,
      reading_date,
      sync_status,
      notes
    } = readingData;
    
    try {
      // Verifikasi customer_id ada di database
      const [customerCheck] = await conn.execute(
        `SELECT customer_id FROM customers WHERE customer_id = ?`,
        [customer_id]
      );
      
      if (customerCheck.length === 0) {
        throw new Error(`Customer dengan ID ${customer_id} tidak ditemukan`);
      }
      
      const [result] = await conn.execute(
        `INSERT INTO meter_readings (
          customer_id,
          user_id,
          previous_reading,
          current_reading,
          reading_date,
          sync_status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          customer_id,
          user_id,
          previous_reading,
          current_reading,
          reading_date,
          sync_status || 'online',
          notes
        ]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
  
  static async getLatestRateId(connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(
      `SELECT rate_id 
       FROM water_rates 
       ORDER BY effective_date DESC 
       LIMIT 1`
    );
    
    return rows[0]?.rate_id || 1; // Default ke 1 jika tidak ada
  }
  
  static async getAverageUsage(customerId) {
    const [rows] = await pool.execute(
      `SELECT AVG(water_usage) as avg_usage
       FROM meter_readings
       WHERE customer_id = ?
       AND deleted_at IS NULL
       ORDER BY reading_date DESC
       LIMIT 3`,
      [customerId]
    );
    
    return rows[0]?.avg_usage || 0;
  }
  
  static async getReadingHistory(customerId) {
    const [rows] = await pool.execute(
      `SELECT 
        mr.reading_id,
        mr.previous_reading,
        mr.current_reading,
        mr.water_usage,
        mr.reading_date,
        mr.status,
        mr.notes,
        mr.sync_status,
        u.username as officer_name,
        b.bill_id,
        b.amount as bill_amount,
        b.status as bill_status
       FROM meter_readings mr
       LEFT JOIN users u ON mr.user_id = u.user_id
       LEFT JOIN bills b ON mr.reading_id = b.reading_id
       WHERE mr.customer_id = ?
       ORDER BY mr.reading_date DESC`,
      [customerId]
    );
    
    return rows.map(row => ({
      ...row,
      previous_reading: parseFloat(row.previous_reading),
      current_reading: parseFloat(row.current_reading),
      water_usage: parseFloat(row.water_usage),
      bill_amount: row.bill_amount ? parseFloat(row.bill_amount) : null
    }));
  }
  
  static async getReadingById(readingId, connection) {
    const conn = connection || pool;
    
    try {
      const [rows] = await conn.execute(
        `SELECT * FROM meter_readings WHERE reading_id = ?`,
        [readingId]
      );
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getRecentReadings(limit = 10) {
    const [rows] = await pool.execute(
      `SELECT 
        mr.*,
        c.full_name as customer_name,
        c.meter_number,
        u.username as officer_name
       FROM meter_readings mr
       JOIN customers c ON mr.customer_id = c.customer_id
       LEFT JOIN users u ON mr.user_id = u.user_id
       ORDER BY mr.reading_date DESC
       LIMIT ?`,
      [limit]
    );
    
    return rows;
  }
  
  static async getReadingsByOfficer(userId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT 
        mr.*,
        c.full_name as customer_name,
        c.meter_number
       FROM meter_readings mr
       JOIN customers c ON mr.customer_id = c.customer_id
       WHERE mr.user_id = ?
       AND mr.reading_date BETWEEN ? AND ?
       ORDER BY mr.reading_date DESC`,
      [userId, startDate, endDate]
    );
    
    return rows;
  }

  static async addFlag(readingId, flagType, flagValue = null, notes = null, userId = null, connection) {
    const conn = connection || pool;
    
    const validFlagTypes = ['reading_note', 'meter_replacement', 'reading_correction', 'system_note', 'suspicious'];
    if (!validFlagTypes.includes(flagType)) {
      throw new Error(`Invalid flag type. Allowed types are: ${validFlagTypes.join(', ')}`);
    }
    
    const [result] = await conn.execute(
      `INSERT INTO reading_flags (
        reading_id,
        flag_type,
        flag_value,
        notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?)`,
      [readingId, flagType, flagValue, notes, userId]
    );
    
    return result.insertId;
  }

  static async getFlags(readingId, connection) {
    const conn = connection || pool;
    
    const [rows] = await conn.execute(
      `SELECT 
        f.*,
        u.username as created_by_user
       FROM reading_flags f
       LEFT JOIN users u ON f.created_by = u.user_id
       WHERE f.reading_id = ?
       ORDER BY f.created_at DESC`,
      [readingId]
    );
    
    return rows;
  }
}

module.exports = MeterReadingModel;
