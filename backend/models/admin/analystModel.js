const pool = require('../../config/db');

class AnalystModel {

     /**
     * FUNGSI BARU: Mengambil data detail untuk satu petugas spesifik.
     * @param {number} officerId - ID petugas.
     * @param {string} startDate - Tanggal mulai periode.
     * @param {string} endDate - Tanggal akhir periode.
     * @returns {Promise<object>}
     */
    static async getOfficerDetail(officerId, startDate, endDate) {
        const connection = await pool.getConnection();
        try {
            const [
                kpiResult,
                revenueTrendResult,
                revenueByAreaResult,
                transactionHistoryResult
            ] = await Promise.all([
                // Query untuk KPI Utama dengan JOIN yang diperbaiki
                connection.execute(`
                    SELECT
                        u.full_name,
                        GROUP_CONCAT(DISTINCT a.area_name SEPARATOR ', ') as handled_areas,
                        COUNT(DISTINCT p.payment_id) as total_transactions,
                        COALESCE(SUM(p.total_payment_power), 0) as total_revenue,
                        COUNT(DISTINCT c.customer_id) as unique_customers_served
                    FROM users u
                    LEFT JOIN officer_areas oa ON u.user_id = oa.user_id
                    LEFT JOIN areas a ON oa.area_id = a.area_id
                    LEFT JOIN customers c ON a.area_id = c.area_id
                    LEFT JOIN bills b ON c.customer_id = b.customer_id
                    LEFT JOIN payments p ON (p.bill_id = b.bill_id OR p.customer_id = c.customer_id)
                        AND p.status = 'completed' 
                        AND DATE(p.transaction_date) BETWEEN ? AND ?
                        AND p.user_id = u.user_id
                    WHERE u.user_id = ?
                    GROUP BY u.full_name;
                `, [startDate, endDate, officerId]),

                // Query untuk Tren Pendapatan Harian (sudah benar)
                connection.execute(`
                    SELECT 
                        DATE(transaction_date) as date,
                        SUM(total_payment_power) as daily_revenue
                    FROM payments
                    WHERE user_id = ? AND status = 'completed' AND DATE(transaction_date) BETWEEN ? AND ?
                    GROUP BY DATE(transaction_date)
                    ORDER BY date ASC;
                `, [officerId, startDate, endDate]),

                // Query untuk Komposisi Pendapatan per Wilayah (sudah benar)
                connection.execute(`
                    SELECT 
                        a.area_name,
                        SUM(p.total_payment_power) as total_revenue
                    FROM payments p
                    JOIN customers c ON p.customer_id = c.customer_id
                    JOIN areas a ON c.area_id = a.area_id
                    WHERE p.user_id = ? AND p.status = 'completed' AND DATE(p.transaction_date) BETWEEN ? AND ?
                    GROUP BY a.area_name;
                `, [officerId, startDate, endDate]),

                // Query untuk Riwayat Transaksi (sudah benar)
                connection.execute(`
                    SELECT 
                        p.transaction_date,
                        c.full_name as customer_name,
                        a.area_name,
                        p.total_payment_power as amount,
                        p.method
                    FROM payments p
                    JOIN customers c ON p.customer_id = c.customer_id
                    JOIN areas a ON c.area_id = a.area_id
                    WHERE p.user_id = ? AND p.status = 'completed' AND DATE(p.transaction_date) BETWEEN ? AND ?
                    ORDER BY p.transaction_date DESC
                    LIMIT 100;
                `, [officerId, startDate, endDate])
            ]);

            if (kpiResult[0].length === 0) {
                // Jika tidak ada data, coba ambil nama petugas saja
                const [user] = await connection.execute('SELECT full_name FROM users WHERE user_id = ?', [officerId]);
                if (user.length > 0) {
                     return {
                        kpi: { full_name: user[0].full_name, handled_areas: '', total_transactions: 0, total_revenue: '0.00', unique_customers_served: 0 },
                        revenueTrend: [],
                        revenueByArea: [],
                        transactionHistory: []
                    };
                }
                return null;
            }

            return {
                kpi: kpiResult[0][0],
                revenueTrend: revenueTrendResult[0],
                revenueByArea: revenueByAreaResult[0],
                transactionHistory: transactionHistoryResult[0]
            };

        } finally {
            if (connection) connection.release();
        }
    }

    // ... (fungsi getOverallSummary tidak berubah)
    static async getOverallSummary(startDate, endDate, connection = pool) {
        // Query 1: KPI Agregat
        const [summaryRows] = await connection.execute(`
            SELECT
                COUNT(customer_id) as total_pelanggan_aktif,
                SUM(CASE WHEN hutang > 0 THEN 1 ELSE 0 END) as pelanggan_menunggak,
                COALESCE(SUM(hutang), 0) as total_tunggakan,
                SUM(CASE WHEN saldo > 0 THEN 1 ELSE 0 END) as pelanggan_bersaldo,
                COALESCE(SUM(saldo), 0) as total_saldo_pelanggan
            FROM v_admin_customer_list
            WHERE status = 'active'
        `);
        
        // Query 2: Komposisi Status Pelanggan untuk Donut Chart
        const [compositionRows] = await connection.execute(`
            SELECT
                SUM(CASE WHEN hutang = 0 AND saldo = 0 THEN 1 ELSE 0 END) as normal,
                SUM(CASE WHEN hutang > 0 THEN 1 ELSE 0 END) as inDebt,
                SUM(CASE WHEN saldo > 0 THEN 1 ELSE 0 END) as hasBalance
            FROM v_admin_customer_list
            WHERE status = 'active'
        `);

        // Query 3: Total pendapatan terkumpul
        const [paymentRows] = await connection.execute(`
            SELECT COALESCE(SUM(total_payment_power), 0) as total_pendapatan_terkumpul
            FROM payments
            WHERE status = 'completed' AND DATE(transaction_date) BETWEEN ? AND ?
        `, [startDate, endDate]);

        // Query 4: Total tagihan terbit
        const [billRows] = await connection.execute(`
            SELECT COALESCE(SUM(amount), 0) as total_tagihan_terbit
            FROM bills
            WHERE status != 'cancelled' AND period_end BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const summary = summaryRows[0];
        summary.customerStatusComposition = compositionRows[0]; // Tambahkan objek komposisi
        summary.total_pendapatan_terkumpul = paymentRows[0].total_pendapatan_terkumpul;
        summary.total_tagihan_terbit = billRows[0].total_tagihan_terbit;

        // Kalkulasi Collection Rate
        summary.collection_rate = summary.total_tagihan_terbit > 0 
            ? (summary.total_pendapatan_terkumpul / summary.total_tagihan_terbit) * 100 
            : 0;

        return summary;
    }

    // ... (fungsi getOfficerLeaderboard tidak berubah)
    static async getOfficerLeaderboard(startDate, endDate, connection = pool) {
        const [rows] = await connection.execute('CALL GetOfficerRevenueSummary(?, ?)', [startDate, endDate]);
        return rows[0];
    }

static async getAreaPerformance(startDate, endDate, connection = pool) {
    const [rows] = await connection.execute(`
        SELECT
            a.area_name,
            -- Kalkulasi pendapatan dengan alur JOIN yang benar
            COALESCE(SUM(CASE 
                WHEN p.status = 'completed' AND DATE(p.transaction_date) BETWEEN ? AND ? 
                THEN p.total_payment_power 
                ELSE 0 
            END), 0) AS total_revenue,
            -- Kalkulasi tunggakan
            COALESCE(debt.total_tunggakan, 0) AS total_tunggakan,
            COALESCE(debt.jumlah_pelanggan_menunggak, 0) AS jumlah_pelanggan_menunggak
        FROM areas a
        -- Alur JOIN yang benar: dari wilayah ke pelanggan, lalu ke tagihan, baru ke pembayaran
        LEFT JOIN customers c ON a.area_id = c.area_id
        LEFT JOIN bills b ON c.customer_id = b.customer_id
        LEFT JOIN payments p ON b.bill_id = p.bill_id
        -- Subquery untuk tunggakan tetap sama
        LEFT JOIN (
            SELECT area_name, SUM(hutang) AS total_tunggakan, COUNT(customer_id) as jumlah_pelanggan_menunggak
            FROM v_admin_customer_list
            WHERE hutang > 0
            GROUP BY area_name
        ) AS debt ON a.area_name = debt.area_name
        GROUP BY a.area_name
        ORDER BY total_revenue DESC;
    `, [startDate, endDate]);
    return rows;
}

    // ... (fungsi getTopDefaulters & getLongestOverdueCustomers tidak berubah, karena sudah pakai view)
     static async getTopDefaulters(connection = pool) {
        // Query ini memanfaatkan view v_admin_customer_list
        const [rows] = await connection.execute(`
            SELECT customer_id, full_name, area_name, officer_in_charge, hutang, unpaid_bills_count
            FROM v_admin_customer_list
            WHERE hutang > 0
            ORDER BY hutang DESC
            LIMIT 10;
        `);
        return rows;
    }

    static async getLongestOverdueCustomers(connection = pool) {
        const [rows] = await connection.execute(`
            SELECT 
                c.customer_id,
                c.full_name,
                c.area_name,
                c.officer_in_charge,
                c.hutang,
                MIN(b.period_end) as oldest_due_date
            FROM v_admin_customer_list c
            JOIN bills b ON c.customer_id = b.customer_id
            WHERE b.status IN ('unpaid', 'partial', 'overdue')
            GROUP BY c.customer_id, c.full_name, c.area_name, c.officer_in_charge, c.hutang
            ORDER BY oldest_due_date ASC
            LIMIT 10;
        `);
        return rows;
    }

    /**
     * PERBAIKAN: Mengambil pelanggan dengan pemakaian air nol.
     * @param {object} connection - Koneksi database.
     * @returns {Promise<Array>}
     */
    static async getZeroUsageCustomers(connection = pool) {
        // TAMBAHKAN JOIN KE TABEL 'areas'
        const [rows] = await connection.execute(`
            SELECT 
                c.customer_id, 
                c.full_name, 
                a.area_name, -- Ambil area_name dari tabel areas
                mr.current_reading, 
                mr.reading_date
            FROM customers c
            JOIN areas a ON c.area_id = a.area_id -- Lakukan JOIN
            JOIN meter_readings mr ON c.customer_id = mr.customer_id
            WHERE mr.water_usage = 0 
              AND mr.reading_id IN (
                  SELECT MAX(reading_id) 
                  FROM meter_readings 
                  GROUP BY customer_id
              )
            LIMIT 10;
        `);
        return rows;
    }

    /**
     * PERBAIKAN: Mengambil pelanggan yang belum ditagih bulan ini.
     * @param {object} connection - Koneksi database.
     * @returns {Promise<Array>}
     */
    static async getNotBilledCustomers(connection = pool) {
        // Cukup gunakan view v_admin_customer_list yang sudah memiliki semua data.
        const [rows] = await connection.execute(`
            SELECT customer_id, full_name, area_name, officer_in_charge
            FROM v_admin_customer_list
            WHERE customer_id NOT IN (
                SELECT DISTINCT customer_id FROM bills 
                WHERE MONTH(period_end) = MONTH(CURDATE()) 
                  AND YEAR(period_end) = YEAR(CURDATE())
            )
            LIMIT 10;
        `);
        return rows;
    }

     /**
     * FUNGSI BARU: Mengambil data detail untuk satu pelanggan spesifik (ledger).
     * @param {number} customerId - ID pelanggan.
     * @returns {Promise<object>}
     */
    static async getCustomerLedger(customerId) {
        // Memanfaatkan stored procedure yang sudah ada untuk mengambil riwayat transaksi
        const [rows] = await pool.execute('CALL GetAdminCustomerLedgerTransactions(?)', [customerId]);
        
        const [summary] = await pool.execute(`
            SELECT full_name, address, area_name, category_name, meter_number, officer_in_charge, hutang, saldo, status
            FROM v_admin_customer_list
            WHERE customer_id = ?
        `, [customerId]);

        if (summary.length === 0) {
            return null; // Pelanggan tidak ditemukan
        }

        return {
            summary: summary[0],
            ledger: rows[0]
        };
    }
}

module.exports = AnalystModel;