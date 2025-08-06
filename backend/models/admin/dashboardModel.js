const pool = require('../../config/db');

class DashboardModel {

static async getSummary(connection = pool) {
    const [summaryRows] = await connection.execute(`
        SELECT
            (SELECT COUNT(customer_id) FROM customers) as totalCustomers,
            (SELECT COUNT(customer_id) FROM customers WHERE status = 'active') as activeCustomers,
            (SELECT COUNT(customer_id) FROM customers WHERE status != 'active') as inactiveCustomers,
            COALESCE((SELECT SUM(hutang) FROM customers WHERE hutang > 0), 0) as totalUnpaidBills,
            
            -- Pendapatan Hari Ini
            COALESCE((SELECT SUM(total_payment_power) FROM payments 
                      WHERE DATE(transaction_date) = CURDATE()), 0) as incomeToday,
            
            -- Pendapatan Minggu Ini (dimulai dari hari Senin)
            COALESCE((SELECT SUM(total_payment_power) FROM payments 
                      WHERE YEARWEEK(transaction_date, 1) = YEARWEEK(CURDATE(), 1)), 0) as incomeThisWeek,
            
            -- Pendapatan Bulan Ini
            COALESCE((SELECT SUM(total_payment_power) FROM payments 
                      WHERE MONTH(transaction_date) = MONTH(CURDATE()) AND YEAR(transaction_date) = YEAR(CURDATE())), 0) as incomeThisMonth,
            
            -- Pengeluaran Bulan Ini
            COALESCE((SELECT SUM(amount) FROM financials 
                      WHERE type = 'expense' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())), 0) as expenseThisMonth
    `);
    return summaryRows[0];
}


    /**
     * Mengambil data tren pemasukan vs pengeluaran untuk 6 bulan terakhir.
     */
    static async getIncomeExpenseTrend(connection = pool) {
        const [rows] = await connection.execute(`
            SELECT
                DATE_FORMAT(date, '%b') as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as pemasukan,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as pengeluaran
            FROM financials
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(date, '%Y-%m')
            ORDER BY DATE_FORMAT(date, '%Y-%m') ASC;
        `);
        return rows;
    }

    /**
     * Mengambil daftar pelanggan yang menunggak lebih dari 3 bulan.
     */
    static async getOverdueCustomers(connection = pool) {
        const [rows] = await connection.execute(`
            SELECT
                c.full_name as name,
                c.phone_number,
                c.hutang as amount
            FROM customers c
            WHERE c.hutang > 0 AND EXISTS (
                SELECT 1 FROM bills b
                WHERE b.customer_id = c.customer_id
                AND b.status IN ('unpaid', 'partial', 'overdue')
                AND b.due_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            )
            ORDER BY c.hutang DESC;
        `);
        return rows;
    }

    /**
     * PERBAIKAN: Mengambil 5 transaksi keuangan terbaru, bukan log sistem.
     */
    static async getLatestNotifications(connection = pool) {
        const [rows] = await connection.execute(`
            SELECT 
                description as message, 
                created_at as time,
                type,
                amount
            FROM financials
            ORDER BY created_at DESC
            LIMIT 5;
        `);
        return rows;
    }



    /**
     * Mengambil data jumlah pelanggan per wilayah.
     */
    static async getCustomersByArea(connection = pool) {
        // Memanfaatkan view untuk efisiensi
        const [rows] = await connection.execute(`
            SELECT area_name as wilayah, COUNT(customer_id) as jumlah
            FROM v_admin_customer_list
            GROUP BY area_name
            ORDER BY jumlah DESC;
        `);
        return rows;
    }

    /**
     * Mengambil data ringkasan aktivitas petugas.
     */
    static async getOfficerActivity(connection = pool) {    
    const [rows] = await connection.execute(`
        SELECT
            (SELECT COUNT(user_id) FROM users WHERE role = 'petugas' AND is_active = 1) as totalPetugasAktif,
            
            -- Aktivitas Pembayaran HARI INI oleh petugas
            (SELECT COUNT(payment_id) FROM payments 
             WHERE DATE(transaction_date) = CURDATE() 
             AND user_id IN (SELECT user_id FROM users WHERE role = 'petugas')) as pembayaranHariIni,
            
            -- Aktivitas Pembacaan Meter HARI INI oleh petugas
            (SELECT COUNT(reading_id) FROM meter_readings 
             WHERE DATE(reading_date) = CURDATE()
             AND user_id IN (SELECT user_id FROM users WHERE role = 'petugas')) as pembacaanMeterHariIni,
             
            -- Total Pendapatan yang Dikumpulkan Petugas BULAN INI
            COALESCE((SELECT SUM(total_payment_power) FROM payments 
                      WHERE MONTH(transaction_date) = MONTH(CURDATE()) 
                      AND YEAR(transaction_date) = YEAR(CURDATE())
                      AND user_id IN (SELECT user_id FROM users WHERE role = 'petugas')), 0) as pendapatanPetugasBulanIni
    `);
    return rows[0];
    }
}

module.exports = DashboardModel;