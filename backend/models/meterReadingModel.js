const pool = require('../config/db');

class MeterReadingModel {
  /**
   * Mendapatkan pembacaan meter terakhir untuk pelanggan tertentu.
   * @param {number} customerId - ID pelanggan
   * @returns {object} - Pembacaan terakhir atau default { current_reading: 0, reading_date: null }
   */
  static async getLatestReading(customerId) {
    const [rows] = await pool.execute(
      `SELECT current_reading, reading_date
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC
       LIMIT 1`,
      [customerId]
    );
    return rows[0] || { current_reading: 0, reading_date: null };
  }

  /**
   * Memvalidasi pembacaan meter baru.
   * @param {number} customerId - ID pelanggan
   * @param {number} currentReading - Pembacaan meter baru
   * @param {string} readingDate - Tanggal pembacaan
   * @returns {number} - Pembacaan meter sebelumnya
   */
  static async validateReading(customerId, currentReading, readingDate) {
    const [lastReading] = await pool.execute(
      `SELECT current_reading, reading_date,
       AVG(current_reading) OVER (ORDER BY reading_date ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING) as avg_reading
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC
       LIMIT 1`,
      [customerId]
    );

    if (lastReading.length > 0) {
      const lastReadingDate = new Date(lastReading[0].reading_date);
      const newReadingDate = new Date(readingDate);

      if (newReadingDate <= lastReadingDate) {
        throw new Error('Reading date must be after the last reading date');
      }

      if (parseFloat(currentReading) < parseFloat(lastReading[0].current_reading)) {
        throw new Error('Current reading cannot be less than previous reading');
      }

      const avgReading = lastReading[0].avg_reading;
      if (avgReading && currentReading > avgReading * 3) {
        throw new Error('Unusual spike in meter reading detected. Please verify.');
      }

      return lastReading[0].current_reading;
    }

    return 0;
  }

 /**
 * Mencatat pembacaan meter baru.
 * @param {object} readingData - Data pembacaan meter
 * @returns {number} - ID pembacaan yang baru dibuat
 */
static async create(readingData) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO meter_readings (
        customer_id,
        previous_reading,
        current_reading,
        water_usage,
        reading_date,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        readingData.customer_id ?? null,
        readingData.previous_reading ?? null,
        readingData.current_reading ?? null,
        readingData.water_usage ?? null,
        readingData.reading_date ?? null,
        readingData.user_id ?? null,
      ]
    );
    return result.insertId;
  } catch (error) {
    throw error;
  }
}



  /**
   * Mendapatkan pembacaan meter terakhir untuk pelanggan tertentu.
   * @param {number} customerId - ID pelanggan
   * @returns {object} - Pembacaan terakhir
   */
  static async getLastReading(customerId) {
    const [rows] = await pool.execute(
      `SELECT current_reading, reading_date
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC
       LIMIT 1`,
      [customerId]
    );
    return rows[0];
  }

  /**
   * Mendapatkan detail pembacaan meter berdasarkan ID.
   * @param {number} readingId - ID pembacaan
   * @returns {object} - Detail pembacaan
   */
  static async getReadingDetails(readingId) {
    const [rows] = await pool.execute(
      `SELECT
        mr.*,
        c.full_name as customer_name,
        c.customer_id,
        c.meter_number,
        b.bill_id
       FROM meter_readings mr
       JOIN customers c ON mr.customer_id = c.customer_id
       LEFT JOIN bills b ON mr.reading_id = b.reading_id
       WHERE mr.reading_id = ?`,
      [readingId]
    );
    return rows[0];
  }

  /**
   * Mendapatkan riwayat penggunaan air untuk pelanggan tertentu.
   * @param {number} customerId - ID pelanggan
   * @returns {array} - Daftar riwayat pembacaan
   */
  static async getWaterUsageHistory(customerId) {
    const [rows] = await pool.execute(
      `SELECT
        reading_id,
        previous_reading,
        current_reading,
        water_usage,
        reading_date,
        status
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC`,
      [customerId]
    );
    return rows;
  }

  /**
   * Menambahkan flag pada pembacaan meter.
   * @param {number} readingId - ID pembacaan
   * @param {string} flagType - Tipe flag
   * @param {string} flagValue - Nilai flag (opsional)
   * @param {string} notes - Catatan (opsional)
   * @param {number} userId - ID pengguna yang menambahkan flag
   * @returns {number} - ID flag yang baru dibuat
   */
  static async addFlag(readingId, flagType, flagValue = null, notes = null, userId = null) {
    const validFlagTypes = ['reading_note', 'meter_replacement', 'reading_correction', 'system_note'];
    if (!validFlagTypes.includes(flagType)) {
      throw new Error(`Invalid flag type. Allowed types are: ${validFlagTypes.join(', ')}`);
    }
    const [result] = await pool.execute(
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

  /**
   * Mendapatkan semua flag untuk pembacaan meter tertentu.
   * @param {number} readingId - ID pembacaan
   * @returns {array} - Daftar flag
   */
  static async getFlags(readingId) {
    const [rows] = await pool.execute(
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

  /**
   * Menangani penggantian meter.
   * @param {number} customerId - ID pelanggan
   * @param {number} oldReading - Pembacaan meter lama
   * @param {number} newReading - Pembacaan meter baru
   * @param {string} replacementDate - Tanggal penggantian
   * @param {string} notes - Catatan
   * @returns {object} - Detail penggantian
   */
  static async handleMeterReplacement(customerId, oldReading, newReading, replacementDate, notes) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const latestReading = await this.getLatestReading(customerId);
      if (latestReading.reading_date) {
        const lastDate = new Date(latestReading.reading_date);
        if (new Date(replacementDate) <= lastDate) {
          throw new Error('Replacement date must be after the last reading date');
        }
      }

      const finalReadingId = await this.create({
        customer_id: customerId,
        user_id: null,
        previous_reading: latestReading.current_reading,
        current_reading: oldReading,
        reading_date: replacementDate,
        status: 'pending',
        sync_status: 'online',
        notes: `Final reading before meter replacement: ${oldReading}`,
        image_url: null,
      });

      const initialReadingId = await this.create({
        customer_id: customerId,
        user_id: null,
        previous_reading: 0,
        current_reading: newReading,
        reading_date: replacementDate,
        status: 'pending',
        sync_status: 'online',
        notes: `Initial reading after meter replacement: ${newReading}`,
        image_url: null,
      });

      await this.addFlag(finalReadingId, 'meter_replacement', `Final reading: ${oldReading}`, notes, null);
      await this.addFlag(initialReadingId, 'meter_replacement', `Initial reading: ${newReading}`, notes, null);

      await connection.execute(
        'UPDATE customers SET last_meter_replacement = ? WHERE customer_id = ?',
        [replacementDate, customerId]
      );

      await connection.commit();
      return {
        finalReadingId,
        initialReadingId,
        oldReading,
        newReading,
        replacementDate,
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to handle meter replacement: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Memperbarui pembacaan meter.
   * @param {number} readingId - ID pembacaan
   * @param {object} updateData - Data yang akan diperbarui
   */
  static async updateReading(readingId, updateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Dapatkan data pembacaan saat ini
      const [currentReadingData] = await connection.execute(
        `SELECT * FROM meter_readings WHERE reading_id = ?`,
        [readingId]
      );

      if (currentReadingData.length === 0) {
        throw new Error('Reading not found');
      }

      const currentReading = currentReadingData[0];

      // Persiapkan data yang akan diupdate
      const safeData = {
        current_reading: updateData.current_reading !== undefined ? updateData.current_reading : currentReading.current_reading,
        previous_reading: updateData.previous_reading !== undefined ? updateData.previous_reading : currentReading.previous_reading,
        water_usage: updateData.water_usage !== undefined ? updateData.water_usage :
                    (updateData.current_reading !== undefined && updateData.previous_reading !== undefined ?
                     updateData.current_reading - updateData.previous_reading :
                     currentReading.water_usage),
        notes: updateData.notes !== undefined ? updateData.notes : currentReading.notes,
        reading_date: updateData.reading_date || currentReading.reading_date,
        status: updateData.status || currentReading.status
      };

      // Update pembacaan meter
      const [result] = await connection.execute(
        `UPDATE meter_readings
         SET
           current_reading = ?,
           previous_reading = ?,
           water_usage = ?,
           notes = ?,
           reading_date = ?,
           status = ?,
           updated_at = NOW()
         WHERE reading_id = ?`,
        [
          safeData.current_reading,
          safeData.previous_reading,
          safeData.water_usage,
          safeData.notes,
          safeData.reading_date,
          safeData.status,
          readingId
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Reading not found');
      }

      // Tambahkan flag untuk mencatat perubahan
      if (updateData.user_id) {
        await this.addFlag(
          readingId,
          'reading_correction',
          `Updated by admin: ${JSON.stringify(updateData)}`,
          updateData.notes || 'Admin correction',
          updateData.user_id
        );
      }

      // Jika ada tagihan terkait, update juga tagihan
      const [billData] = await connection.execute(
        `SELECT * FROM bills WHERE reading_id = ?`,
        [readingId]
      );

      if (billData.length > 0 && updateData.update_bill !== false) {
        const bill = billData[0];

        // Hanya update tagihan jika belum dibayar
        if (bill.status !== 'paid') {
          // Hitung ulang jumlah tagihan jika water_usage berubah
          let newAmount = bill.amount;

          if (safeData.water_usage !== currentReading.water_usage) {
            // Dapatkan tarif air
            const [rateData] = await connection.execute(
              `SELECT * FROM water_rates WHERE rate_id = ?`,
              [bill.rate_id]
            );

            if (rateData.length > 0) {
              const rate = rateData[0];
              const minimumUsage = parseFloat(rate.minimum_usage) || 0;
              const ratePerCubic = parseFloat(rate.rate_per_cubic) || 0;

              // Hitung ulang jumlah tagihan
              const billableUsage = Math.max(safeData.water_usage, minimumUsage);
              newAmount = billableUsage * ratePerCubic;
            }
          }

          // Update tagihan
          await connection.execute(
            `UPDATE bills
             SET amount = ?, updated_at = NOW()
             WHERE bill_id = ?`,
            [newAmount, bill.bill_id]
          );
        }
      }

      await connection.commit();
      return { readingId, ...safeData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Memvalidasi pembaruan pembacaan meter.
   * @param {number} readingId - ID pembacaan
   * @param {number} newReading - Pembacaan baru
   */
  static async validateReadingUpdate(readingId, newReading) {
    const [reading] = await pool.execute(
      `SELECT
        mr.*,
        b.status as bill_status,
        c.meter_number
       FROM meter_readings mr
       LEFT JOIN bills b ON mr.reading_id = b.reading_id
       LEFT JOIN customers c ON mr.customer_id = c.customer_id
       WHERE mr.reading_id = ?`,
      [readingId]
    );

    if (!reading.length) {
      throw new Error('Reading not found');
    }

    const currentReading = reading[0];

    if (currentReading.bill_status === 'paid') {
      throw new Error('Cannot update: Bill has already been paid');
    }

    if (parseFloat(newReading) < parseFloat(currentReading.previous_reading)) {
      throw new Error('New reading cannot be less than previous reading');
    }

    const [avgResult] = await pool.execute(
      `SELECT AVG(current_reading - previous_reading) as avg_usage
       FROM meter_readings
       WHERE customer_id = ? AND reading_id != ?
       ORDER BY reading_date DESC
       LIMIT 3`,
      [currentReading.customer_id, readingId]
    );

    const avgUsage = avgResult[0].avg_usage || 0;
    const newUsage = newReading - currentReading.previous_reading;

    if (avgUsage > 0 && newUsage > avgUsage * 3) {
      throw new Error('Warning: Unusual spike in meter reading detected');
    }
  }

  /**
   * Mendapatkan riwayat flag untuk pembacaan meter.
   * @param {number} readingId - ID pembacaan
   * @returns {array} - Daftar riwayat flag
   */
  static async getReadingHistory(readingId) {
    const [history] = await pool.execute(
      `SELECT
        rf.*,
        u.username as modified_by
       FROM reading_flags rf
       LEFT JOIN users u ON rf.created_by = u.user_id
       WHERE rf.reading_id = ?
       ORDER BY rf.created_at DESC`,
      [readingId]
    );
    return history;
  }

  /**
   * Mendapatkan semua pembacaan meter (terbatas 100 terbaru).
   * @returns {array} - Daftar pembacaan
   */
  static async getAllReadings() {
    const [rows] = await pool.execute(
      `SELECT
        mr.*,
        c.full_name as customer_name,
        c.meter_number
       FROM meter_readings mr
       JOIN customers c ON mr.customer_id = c.customer_id
       ORDER BY mr.reading_date DESC
       LIMIT 100`
    );
    return rows;
  }

  /**
   * Mendapatkan pembacaan meter yang tidak wajar (pemakaian melonjak).
   * @param {number} threshold - Ambang batas kenaikan (misalnya 3 berarti 3x lipat dari rata-rata)
   * @returns {array} - Daftar pembacaan tidak wajar
   */
  static async getAbnormalReadings(threshold = 3) {
    try {
      // Konversi threshold ke number jika string dan pastikan nilai positif
      let thresholdValue = parseFloat(threshold);

      // Validasi threshold untuk mencegah error SQL
      if (isNaN(thresholdValue) || thresholdValue <= 0) {
        thresholdValue = 1.5; // Nilai default yang aman
      }

      // Query untuk mendapatkan pembacaan dengan pemakaian tidak wajar
      // Menggunakan GREATEST untuk memastikan nilai perbandingan tidak pernah 0
      const [rows] = await pool.execute(`
        WITH customer_avg_usage AS (
          SELECT
            customer_id,
            AVG(water_usage) AS avg_previous_usage
          FROM (
            SELECT
              customer_id,
              water_usage,
              reading_date,
              ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY reading_date DESC) as row_num
            FROM meter_readings
          ) AS recent_readings
          WHERE row_num > 1 AND row_num <= 4
          GROUP BY customer_id
        )
        SELECT
          mr.reading_id,
          mr.customer_id,
          c.full_name AS customer_name,
          c.meter_number,
          mr.previous_reading,
          mr.current_reading,
          mr.water_usage,
          mr.reading_date,
          mr.status,
          b.bill_id,
          b.period_start,
          b.period_end,
          b.due_date,
          b.amount,
          b.status AS bill_status,
          cau.avg_previous_usage,
          ROUND((mr.water_usage / NULLIF(cau.avg_previous_usage, 0)) * 100 - 100, 1) AS usage_increase_percent
        FROM meter_readings mr
        JOIN customers c ON mr.customer_id = c.customer_id
        LEFT JOIN bills b ON mr.reading_id = b.reading_id
        JOIN customer_avg_usage cau ON mr.customer_id = cau.customer_id
        WHERE
          mr.water_usage > GREATEST(cau.avg_previous_usage * ?, 0.1)
          AND cau.avg_previous_usage > 0
        ORDER BY (mr.water_usage / cau.avg_previous_usage) DESC
      `, [thresholdValue]);

      // Format data untuk respons
      return rows.map(row => ({
        ...row,
        reading_date: row.reading_date ? new Date(row.reading_date).toISOString().split('T')[0] : null,
        period_start: row.period_start ? new Date(row.period_start).toISOString().split('T')[0] : null,
        period_end: row.period_end ? new Date(row.period_end).toISOString().split('T')[0] : null,
        due_date: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
        water_usage: parseFloat(row.water_usage || 0),
        previous_reading: parseFloat(row.previous_reading || 0),
        current_reading: parseFloat(row.current_reading || 0),
        amount: parseFloat(row.amount || 0),
        avg_previous_usage: parseFloat(row.avg_previous_usage || 0),
        usage_increase_percent: parseFloat(row.usage_increase_percent || 0)
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MeterReadingModel;