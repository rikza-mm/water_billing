const pool = require('../../config/db');

class HistoryModel {
    /**
     * Memanggil Stored Procedure GetCustomerBillingHistory untuk mendapatkan
     * riwayat tagihan detail dari seorang pelanggan.
     * @param {number} customerId - ID dari pelanggan.
     * @returns {Promise<Array<object>>} - Array berisi objek riwayat tagihan.
     */
    static async getDetailedBillingHistory(customerId) {
        try {
            // Hanya satu panggilan sederhana ke database
            const [rows] = await pool.query('CALL GetCustomerBillingHistory(?)', [customerId]);
            
            // Hasil dari stored procedure biasanya ada di indeks pertama dari array yang dikembalikan
            return rows[0]; 
        } catch (error) {
            throw error; // Lemparkan error agar bisa ditangkap oleh controller
        }
    }
        //view customer history summary
    static async getHistories(filters) {
        const { search = '', status = 'all', area = 'all', period = '', page = 1, limit = 10, userAreaIds = [] } = filters;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        let whereConditions = [];
        let queryParams = [];

        // Filter berdasarkan area yang ditugaskan ke petugas
        if (userAreaIds && userAreaIds.length > 0) {
            const placeholders = userAreaIds.map(() => '?').join(',');
            whereConditions.push(`area_id IN (${placeholders})`);
            queryParams.push(...userAreaIds);
        }

        // Filter berdasarkan pencarian (nama, id, no meter)
        if (search) {
            whereConditions.push(`(name LIKE ? OR id LIKE ? OR meterNumber LIKE ?)`);
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Filter berdasarkan status pelanggan
        if (status && status !== 'all') {
            whereConditions.push(`status = ?`);
            queryParams.push(status);
        }
        
        // Filter berdasarkan area spesifik (jika dipilih dari UI)
        if (area && area !== 'all') {
            whereConditions.push(`area = ?`);
            queryParams.push(area);
        }

        // Filter berdasarkan periode tagihan (contoh format: '2025-06')
        if (period) {
            whereConditions.push(`EXISTS (SELECT 1 FROM bills b WHERE b.customer_id = v.id AND DATE_FORMAT(b.period_end, '%Y-%m') = ?)`);
            queryParams.push(period);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Query untuk menghitung total data yang terfilter
        const countQuery = `SELECT COUNT(*) as total FROM v_customer_history_summary v ${whereClause}`;
        
        // Query untuk mengambil data dengan paginasi
        const dataQuery = `SELECT * FROM v_customer_history_summary v ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`;
        const dataParams = [...queryParams, parseInt(limit, 10), offset];
        
        try {
            const [totalRows] = await pool.query(countQuery, queryParams);
            const [histories] = await pool.query(dataQuery, dataParams);
            
            return {
                histories: histories,
                total: totalRows[0].total
            };
        } catch (error) {
            throw error;
        }
    }



    /**
     * ✅ FUNGSI YANG SUDAH DIPERBAIKI
     * Memanggil Stored Procedure GetCustomerDebtPaymentHistory dan
     * langsung mengembalikan hasilnya tanpa pemrosesan ulang.
     */
    static async getDebtPaymentHistory(customerId) {
        try {
            const [rows] = await pool.query('CALL GetCustomerDebtPaymentHistory(?)', [customerId]);
            
            // Langsung kembalikan hasil dari procedure karena formatnya sudah benar.
            return rows[0] || []; 
        } catch (error) {
            throw error;
        }
    }

    /**
     * Metode ini tetap ada karena memberikan ringkasan finansial yang berbeda
     * dan tidak disediakan oleh GetCustomerBillingHistory.
     * @param {number} customerId - ID pelanggan.
     * @returns {Promise<object|null>} - Objek ringkasan finansial.
     */
    static async getFinancialSummary(customerId) {
        // Query ini bisa Anda pindahkan dari controller ke sini untuk kerapian
        const summaryQuery = `
            SELECT
                c.full_name as customerName, c.address, c.phone_number as phone,
                c.meter_number as meterNumber, c.saldo, c.hutang, a.area_name as area
            FROM customers c
            LEFT JOIN areas a ON c.area_id = a.area_id
            WHERE c.customer_id = ?
            GROUP BY c.customer_id;
        `;
        try {
            const [summaryResult] = await pool.execute(summaryQuery, [customerId]);
            return summaryResult[0] || null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = HistoryModel;