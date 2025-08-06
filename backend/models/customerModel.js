const pool = require('../config/db');

class CustomerModel {
  static async createCustomer(data) {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO customers (
          full_name, area_id, user_id, meter_number,
          phone_number, address, status, registration_date,
          saldo, hutang
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.full_name,
        data.area_id,
        data.user_id || null,
        data.meter_number,
        data.phone_number,
        data.address,
        data.status || 'active',
        data.registration_date || new Date(),
        data.saldo || 0,
        data.hutang || 0
      ];

      const [result] = await connection.execute(query, values);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async getAllCustomers() {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT c.*, a.area_name
        FROM customers c
        LEFT JOIN areas a ON c.area_id = a.area_id
        ORDER BY c.full_name ASC
      `;
      const [rows] = await connection.execute(query);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async getCustomerById(customerId) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT c.*, a.area_name
        FROM customers c
        LEFT JOIN areas a ON c.area_id = a.area_id
        WHERE c.customer_id = ?
      `;
      const [rows] = await connection.execute(query, [customerId]);
      return rows[0];
    } finally {
      connection.release();
    }
  }

  static async getCustomersByAreaId(areaId) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT c.*, a.area_name
        FROM customers c
        LEFT JOIN areas a ON c.area_id = a.area_id
        WHERE c.area_id = ?
        ORDER BY c.full_name ASC
      `;
      const [rows] = await connection.execute(query, [areaId]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async updateCustomer(customerId, data) {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE customers
        SET full_name = ?,
            area_id = ?,
            user_id = ?,
            meter_number = ?,
            phone_number = ?,
            address = ?,
            status = ?,
            saldo = ?,
            hutang = ?
        WHERE customer_id = ?
      `;

      const values = [
        data.full_name,
        data.area_id,
        data.user_id || null,
        data.meter_number,
        data.phone_number,
        data.address,
        data.status,
        data.saldo || 0,
        data.hutang || 0,
        customerId
      ];

      const [result] = await connection.execute(query, values);
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  static async deleteCustomer(customerId) {
    const connection = await pool.getConnection();
    try {
      // Periksa referensi terlebih dahulu
      const references = await this.checkCustomerReferences(customerId);

      if (references.hasReferences) {
        // Jika ada referensi, kita tidak bisa menghapus customer
        const referenceDetails = references.references.map(ref =>
          `${ref.label} (${ref.count} data)`
        ).join(', ');

        throw new Error(`Tidak dapat menghapus pelanggan karena masih memiliki data terkait: ${referenceDetails}`);
      }

      // Jika tidak ada referensi, lanjutkan dengan penghapusan
      const query = `DELETE FROM customers WHERE customer_id = ?`;
      const [result] = await connection.execute(query, [customerId]);
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  static async searchCustomers(keyword) {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT c.*, a.area_name
        FROM customers c
        LEFT JOIN areas a ON c.area_id = a.area_id
        WHERE c.full_name LIKE ?
           OR c.meter_number LIKE ?
           OR c.phone_number LIKE ?
        ORDER BY c.full_name ASC
        LIMIT 50
      `;

      const searchTerm = `%${keyword}%`;
      const [rows] = await connection.execute(query, [
        searchTerm, searchTerm, searchTerm
      ]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async checkMeterNumber(meterNumber, excludeCustomerId = null) {
    return false; // tidak dicek
  }

  static async checkPhoneNumber(phoneNumber, excludeCustomerId = null) {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT customer_id FROM customers WHERE phone_number = ?`;
      let params = [phoneNumber];

      if (excludeCustomerId) {
        query += ` AND customer_id != ?`;
        params.push(excludeCustomerId);
      }

      const [rows] = await connection.execute(query, params);

      // Jika nomor telepon ditemukan pada customer lain
      if (rows.length > 0) {
        // Jika ini update dan nomor telepon milik customer yang sedang diupdate
        if (excludeCustomerId && rows[0].customer_id === excludeCustomerId) {
          return false;
        }
        return true;
      }
      return false;
    } finally {
      connection.release();
    }
  }

  static async updateCreditBalance(customerId, amount) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE customers SET saldo = GREATEST(COALESCE(saldo, 0) + ?, 0) WHERE customer_id = ?',
        [amount, customerId]
      );
    } finally {
      connection.release();
    }
  }

  static async checkCustomerReferences(customerId) {
    const connection = await pool.getConnection();
    try {
      // Dapatkan semua tabel yang memiliki referensi ke customer_id
      const tables = [
        { name: 'bills', label: 'Tagihan', query: 'SELECT COUNT(*) as count FROM bills WHERE customer_id = ?' },
        { name: 'meter_readings', label: 'Pembacaan Meter', query: 'SELECT COUNT(*) as count FROM meter_readings WHERE customer_id = ?' },
        { name: 'installment_plans', label: 'Rencana Cicilan', query: 'SELECT COUNT(*) as count FROM installment_plans WHERE customer_id = ?' },
        { name: 'notifications', label: 'Notifikasi', query: 'SELECT COUNT(*) as count FROM notifications WHERE customer_id = ?' },
        { name: 'payments', label: 'Pembayaran', query: 'SELECT COUNT(*) as count FROM payments p JOIN bills b ON p.bill_id = b.bill_id WHERE b.customer_id = ?' }
      ];

      const references = [];

      // Periksa setiap tabel
      for (const table of tables) {
        const [result] = await connection.execute(
          table.query,
          [customerId]
        );

        if (result[0].count > 0) {
          references.push({
            table: table.name,
            label: table.label,
            count: result[0].count
          });
        }
      }

      if (references.length > 0) {
        return {
          hasReferences: true,
          references: references
        };
      }

      return { hasReferences: false };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  static async forceDeleteCustomer(customerId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Hapus data dari tabel-tabel terkait dalam urutan yang benar
      // (dari child ke parent untuk menghindari constraint violations)

      // 1. Hapus notifikasi
      await connection.execute(
        'DELETE FROM notifications WHERE customer_id = ?',
        [customerId]
      );

      // 2. Hapus pembayaran terkait tagihan pelanggan
      await connection.execute(
        'DELETE p FROM payments p JOIN bills b ON p.bill_id = b.bill_id WHERE b.customer_id = ?',
        [customerId]
      );

      // 3. Hapus cicilan dan payment_installments
      await connection.execute(
        'DELETE ip FROM installment_plans ip WHERE ip.customer_id = ?',
        [customerId]
      );

      await connection.execute(
        'DELETE pi FROM payment_installments pi JOIN bills b ON pi.bill_id = b.bill_id WHERE b.customer_id = ?',
        [customerId]
      );

      // 4. Hapus entri di tabel financials yang terkait dengan pembayaran pelanggan
      await connection.execute(`
        DELETE f FROM financials f
        JOIN payments p ON f.payment_id = p.payment_id
        JOIN bills b ON p.bill_id = b.bill_id
        WHERE b.customer_id = ?
      `, [customerId]);

      // 5. Hapus tagihan
      await connection.execute(
        'DELETE FROM bills WHERE customer_id = ?',
        [customerId]
      );

      // 6. Hapus pembacaan meter
      await connection.execute(
        'DELETE FROM meter_readings WHERE customer_id = ?',
        [customerId]
      );

      // 7. Akhirnya, hapus pelanggan
      const [result] = await connection.execute(
        'DELETE FROM customers WHERE customer_id = ?',
        [customerId]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deactivateCustomer(customerId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE customers SET status = "inactive" WHERE customer_id = ?',
        [customerId]
      );
    } finally {
      connection.release();
    }
  }

  static async getNearbyCustomers(lat, lng, radius = 5000) {
    const [rows] = await pool.execute(
      `SELECT
        c.*,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance
      FROM customers c
      HAVING distance < ?
      ORDER BY distance
      LIMIT 50`,
      [lat, lng, lat, radius / 1000]
    );
    return rows;
  }

  static async getCustomerReadingHistory(customerId) {
    const [rows] = await pool.execute(
      `SELECT
        reading_id,
        current_reading,
        reading_date,
        water_usage
       FROM meter_readings
       WHERE customer_id = ?
       ORDER BY reading_date DESC
       LIMIT 12`,
      [customerId]
    );
    return rows;
  }
}

module.exports = CustomerModel;
