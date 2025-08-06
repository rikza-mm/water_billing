const pool = require('../../config/db');

class WaterUsageModel {

    /**
     * Mengambil data ringkasan umum pemakaian air (KPI Cards).
     */
    static async getUsageSummary(startDate, endDate, connection = pool) {
        const [summaryRows] = await connection.execute(`
            SELECT
                (SELECT COALESCE(SUM(mr.water_usage), 0) FROM meter_readings mr WHERE mr.reading_date BETWEEN ? AND ?) as totalUsageM3,
                (SELECT COUNT(c.customer_id) FROM customers c WHERE c.status = 'active') as activeCustomers,
                (SELECT COALESCE(SUM(p.total_payment_power), 0) FROM payments p WHERE DATE(p.transaction_date) BETWEEN ? AND ?) as totalRevenue
        `, [startDate, endDate, startDate, endDate]);

        const [topConsumerRows] = await connection.execute(`
            SELECT c.customer_id, c.full_name, mr.water_usage as usage_m3
            FROM meter_readings mr
            JOIN customers c ON mr.customer_id = c.customer_id
            WHERE mr.reading_date BETWEEN ? AND ?
            ORDER BY mr.water_usage DESC
            LIMIT 1;
        `, [startDate, endDate]);
        
        const summary = summaryRows[0];
        summary.avgUsagePerCustomer = summary.activeCustomers > 0 ? summary.totalUsageM3 / summary.activeCustomers : 0;
        summary.revenuePerM3 = summary.totalUsageM3 > 0 ? summary.totalRevenue / summary.totalUsageM3 : 0;
        summary.topConsumer = topConsumerRows[0] || null;

        return summary;
    }

    /**
     * Mengambil data tren pemakaian air bulanan untuk 6 bulan terakhir.
     */
    static async getMonthlyUsageTrend(connection = pool) {
        const [rows] = await connection.execute(`
            SELECT
                DATE_FORMAT(reading_date, '%b %y') as month,
                SUM(water_usage) as totalUsageM3
            FROM meter_readings
            WHERE reading_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(reading_date, '%Y-%m')
            ORDER BY DATE_FORMAT(reading_date, '%Y-%m') ASC;
        `);
        return rows;
    }

    /**
     * Mengambil data analisis pemakaian per wilayah.
     */
    static async getUsageByArea(startDate, endDate, connection = pool) {
        const [rows] = await connection.execute(`
            SELECT
                a.area_name,
                COALESCE(SUM(mr.water_usage), 0) as totalUsageM3,
                COUNT(DISTINCT c.customer_id) as customerCount,
                COALESCE(SUM(p.total_payment_power), 0) as totalRevenue
            FROM areas a
            LEFT JOIN customers c ON a.area_id = c.area_id
            LEFT JOIN meter_readings mr ON c.customer_id = mr.customer_id AND mr.reading_date BETWEEN ? AND ?
            LEFT JOIN payments p ON c.customer_id = p.customer_id AND DATE(p.transaction_date) BETWEEN ? AND ?
            GROUP BY a.area_name
            ORDER BY totalUsageM3 DESC;
        `, [startDate, endDate, startDate, endDate]);

        // Kalkulasi rata-rata setelah query
        return rows.map(row => ({
            ...row,
            avgUsagePerCustomer: row.customerCount > 0 ? row.totalUsageM3 / row.customerCount : 0
        }));
    }

    /**
     * Mengambil daftar pelanggan dengan pemakaian tertinggi dan terendah.
     */
    static async getCustomerUsageAnalysis(startDate, endDate, connection = pool) {
        const commonQuery = `
            FROM meter_readings mr
            JOIN customers c ON mr.customer_id = c.customer_id
            JOIN areas a ON c.area_id = a.area_id
            LEFT JOIN bills b ON mr.bill_id = b.bill_id
            WHERE mr.reading_date BETWEEN ? AND ?
        `;

        const [topUsageCustomers] = await connection.execute(`
            SELECT c.customer_id, c.full_name, a.area_name, mr.water_usage as waterUsageM3, b.amount as lastBillAmount
            ${commonQuery}
            ORDER BY mr.water_usage DESC
            LIMIT 10;
        `, [startDate, endDate]);

        const [lowUsageCustomers] = await connection.execute(`
            SELECT c.customer_id, c.full_name, a.area_name, mr.water_usage as waterUsageM3, b.amount as lastBillAmount
            ${commonQuery}
            ORDER BY mr.water_usage ASC
            LIMIT 10;
        `, [startDate, endDate]);

        return {
            topUsageCustomers,
            lowUsageCustomers
        };
    }
}

module.exports = WaterUsageModel;
