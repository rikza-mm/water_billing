const pool = require('../../config/db');
const MeterReadingModel = require('../../models/meterReadingModel');
const BillModel = require('../../models/billModel');
const LogModel = require('../../models/logModel');

class MeterReadingController {
  /**
   * Mendapatkan semua pembacaan meter dengan filter dan pagination
   */
  static async getAllReadings(req, res) {
    try {
      const {
        customer_id,
        area_id,
        start_date,
        end_date,
        status,
        page = 1,
        limit = 10,
        sort_by = 'reading_date',
        sort_order = 'desc',
        search = ''
      } = req.query;

      const offset = (page - 1) * limit;

      // Buat query dasar
      let query = `
        SELECT
          mr.reading_id,
          mr.customer_id,
          c.full_name AS customer_name,
          c.meter_number,
          a.area_name,
          mr.previous_reading,
          mr.current_reading,
          mr.water_usage,
          mr.reading_date,
          mr.status,
          mr.notes,
          mr.user_id,
          u.username AS reader_name,
          b.bill_id,
          b.status AS bill_status,
          b.amount AS bill_amount,
          (
            SELECT COUNT(*)
            FROM reading_flags rf
            WHERE rf.reading_id = mr.reading_id
          ) AS flag_count
        FROM meter_readings mr
        JOIN customers c ON mr.customer_id = c.customer_id
        JOIN areas a ON c.area_id = a.area_id
        LEFT JOIN users u ON mr.user_id = u.user_id
        LEFT JOIN bills b ON mr.reading_id = b.reading_id
        WHERE 1=1
      `;

      // Tambahkan filter
      const params = [];

      if (customer_id) {
        query += ` AND mr.customer_id = ?`;
        params.push(customer_id);
      }

      if (area_id) {
        query += ` AND c.area_id = ?`;
        params.push(area_id);
      }

      if (start_date) {
        query += ` AND mr.reading_date >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND mr.reading_date <= ?`;
        params.push(end_date);
      }

      if (status) {
        query += ` AND mr.status = ?`;
        params.push(status);
      }

      if (search) {
        query += ` AND (c.full_name LIKE ? OR c.meter_number LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      // Tambahkan sorting
      query += ` ORDER BY ${sort_by} ${sort_order}`;

      // Tambahkan pagination
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

      // Jalankan query
      const [readings] = await pool.execute(query, params);

      // Hitung total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM meter_readings mr
        JOIN customers c ON mr.customer_id = c.customer_id
        JOIN areas a ON c.area_id = a.area_id
        WHERE 1=1
      `;

      // Tambahkan filter yang sama untuk count
      const countParams = [];

      if (customer_id) {
        countQuery += ` AND mr.customer_id = ?`;
        countParams.push(customer_id);
      }

      if (area_id) {
        countQuery += ` AND c.area_id = ?`;
        countParams.push(area_id);
      }

      if (start_date) {
        countQuery += ` AND mr.reading_date >= ?`;
        countParams.push(start_date);
      }

      if (end_date) {
        countQuery += ` AND mr.reading_date <= ?`;
        countParams.push(end_date);
      }

      if (status) {
        countQuery += ` AND mr.status = ?`;
        countParams.push(status);
      }

      if (search) {
        countQuery += ` AND (c.full_name LIKE ? OR c.meter_number LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      // Format data untuk respons
      const formattedReadings = readings.map(reading => ({
        ...reading,
        reading_date: reading.reading_date ? new Date(reading.reading_date).toISOString().split('T')[0] : null,
        previous_reading: parseFloat(reading.previous_reading || 0),
        current_reading: parseFloat(reading.current_reading || 0),
        water_usage: parseFloat(reading.water_usage || 0),
        bill_amount: parseFloat(reading.bill_amount || 0),
        flag_count: parseInt(reading.flag_count || 0)
      }));

      res.json({
        success: true,
        data: formattedReadings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan data pembacaan meter',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan detail pembacaan meter berdasarkan ID
   */
  static async getReadingDetail(req, res) {
    try {
      const { id } = req.params;

      // Dapatkan detail pembacaan meter
      const reading = await MeterReadingModel.getReadingDetails(id);

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: 'Pembacaan meter tidak ditemukan'
        });
      }

      // Dapatkan flag pembacaan meter
      const flags = await MeterReadingModel.getFlags(id);

      // Dapatkan tagihan terkait
      let bill = null;
      if (reading.bill_id) {
        bill = await BillModel.getBillDetails(reading.bill_id);
      }

      res.json({
        success: true,
        data: {
          reading: {
            ...reading,
            reading_date: reading.reading_date ? new Date(reading.reading_date).toISOString().split('T')[0] : null,
            previous_reading: parseFloat(reading.previous_reading || 0),
            current_reading: parseFloat(reading.current_reading || 0),
            water_usage: parseFloat(reading.water_usage || 0)
          },
          flags,
          bill
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan detail pembacaan meter',
        error: error.message
      });
    }
  }

  /**
   * Mengedit pembacaan meter
   */
  static async updateReading(req, res) {
    try {
      const { id } = req.params;
      const {
        current_reading,
        previous_reading,
        reading_date,
        notes,
        status,
        update_bill = true
      } = req.body;
      const user_id = req.user.id;

      // Validasi pembacaan meter ada
      const reading = await MeterReadingModel.getReadingDetails(id);
      if (!reading) {
        return res.status(404).json({
          success: false,
          message: 'Pembacaan meter tidak ditemukan'
        });
      }

      // Validasi tagihan belum dibayar jika ada
      if (reading.bill_id) {
        const bill = await BillModel.getBillDetails(reading.bill_id);
        if (bill && bill.status === 'paid') {
          return res.status(400).json({
            success: false,
            message: 'Tidak dapat mengedit pembacaan meter yang tagihan sudah dibayar'
          });
        }
      }

      // Hitung water_usage jika current_reading dan previous_reading diisi
      let water_usage;
      if (current_reading !== undefined && previous_reading !== undefined) {
        water_usage = current_reading - previous_reading;
      } else if (current_reading !== undefined) {
        water_usage = current_reading - parseFloat(reading.previous_reading);
      }

      // Update pembacaan meter
      const updatedReading = await MeterReadingModel.updateReading(id, {
        current_reading,
        previous_reading,
        water_usage,
        reading_date,
        notes,
        status,
        user_id,
        update_bill
      });

      // Log aktivitas
      await LogModel.create({
        user_id,
        log_type: 'data_change',
        action: 'update',
        description: `Admin mengedit pembacaan meter #${id}`,
        affected_table: 'meter_readings',
        affected_id: id,
        severity: 'info'
      });

      res.json({
        success: true,
        message: 'Pembacaan meter berhasil diperbarui',
        data: updatedReading
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pembacaan meter',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan pembacaan meter yang tidak wajar (pemakaian melonjak)
   */
  static async getAbnormalReadings(req, res) {
    try {
      // Ambil nilai threshold dari query parameter, default 3
      let { threshold = 3 } = req.query;

      // Konversi threshold ke number dan validasi
      threshold = parseFloat(threshold);

      // Pastikan threshold adalah angka positif yang valid
      // Ini mencegah error "DOUBLE value is out of range" saat threshold = 0
      if (isNaN(threshold) || threshold <= 0) {
        threshold = 1.5; // Nilai default yang aman jika input tidak valid
      }

      // Batasi nilai maksimum threshold untuk mencegah query yang terlalu ketat
      if (threshold > 10) {
        threshold = 10;
      }

      const abnormalReadings = await MeterReadingModel.getAbnormalReadings(threshold);

      res.json({
        success: true,
        data: abnormalReadings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan data pembacaan meter tidak wajar',
        error: error.message
      });
    }
  }
}

module.exports = MeterReadingController;
