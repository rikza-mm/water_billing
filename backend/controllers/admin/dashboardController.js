const DashboardModel = require('../../models/admin/dashboardModel');

class DashboardController {

    static async getDashboardSummary(req, res) {
        try {
            // Panggil semua metode dari model secara paralel untuk efisiensi
            const [
                summary,
                incomeExpenseTrend,
                overdueCustomers,
                notifications,
                customersByArea,
                officerActivity
            ] = await Promise.all([
                DashboardModel.getSummary(),
                DashboardModel.getIncomeExpenseTrend(),
                DashboardModel.getOverdueCustomers(),
                DashboardModel.getLatestNotifications(),
                DashboardModel.getCustomersByArea(),
                DashboardModel.getOfficerActivity()
            ]);

            // Susun data dalam satu objek respons sesuai format yang diinginkan
        const responseData = {
            summary: {
                totalCustomers: summary.totalCustomers || 0,
                activeCustomers: summary.activeCustomers || 0,
                inactiveCustomers: summary.inactiveCustomers || 0,
                totalUnpaidBills: parseFloat(summary.totalUnpaidBills) || 0,
                incomeThisMonth: parseFloat(summary.incomeThisMonth) || 0,
                incomeToday: parseFloat(summary.incomeToday) || 0,
                incomeThisWeek: parseFloat(summary.incomeThisWeek) || 0,
                expenseThisMonth: parseFloat(summary.expenseThisMonth) || 0
            },
                incomeExpenseTrend,
                overdueCustomers,
                notifications,
                customersByArea,
                officerActivity
            };

            res.status(200).json({ success: true, data: responseData });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data dasbor admin.' });
        }
    }
}

module.exports = DashboardController;