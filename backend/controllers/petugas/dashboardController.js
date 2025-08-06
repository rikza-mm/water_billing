const PetugasDashboardModel = require('../../models/petugas/dashboardModel');

class PetugasDashboardController {
    static async getDashboardData(req, res) {
        try {
            const userId = req.user.id;
            const dashboardData = await PetugasDashboardModel.getDashboardData(userId);
            
            // Ekstrak data dari objek yang diterima
            const { revenueCard, kpiCards, revenueChart } = dashboardData;

            // Parsing revenueChart jika masih string
            let chartData = [];
            if (typeof revenueChart === 'string') {
                try {
                    chartData = JSON.parse(revenueChart);
                } catch {
                    chartData = [];
                }
            } else if (Array.isArray(revenueChart)) {
                chartData = revenueChart;
            }

            // Hitung summary chart jika ingin (opsional)
            const totalChartRevenue = chartData.reduce((sum, item) => sum + parseFloat(item.monthlyRevenue || 0), 0);
            const monthlyAverage = chartData.length > 0 ? totalChartRevenue / chartData.length : 0;

            // Hitung percentageChange jika ingin (opsional, bisa juga langsung dari revenueCard)
            let percentageChange = 0;
            if (revenueCard && revenueCard.previousMonthRevenue && revenueCard.previousMonthRevenue > 0) {
                percentageChange = ((revenueCard.currentMonthRevenue - revenueCard.previousMonthRevenue) / revenueCard.previousMonthRevenue) * 100;
            }

            const responseData = {
                revenueCard: {
                    currentMonthRevenue: parseFloat(revenueCard.currentMonthRevenue),
                    previousMonthRevenue: parseFloat(revenueCard.previousMonthRevenue),
                    percentageChange: parseFloat(percentageChange.toFixed(1)),
                    changeType: percentageChange >= 0 ? 'increase' : 'decrease'
                },
                kpiCards: {
                    totalCustomers: parseInt(kpiCards.totalCustomers, 10),
                    totalUsageThisMonth: parseFloat(kpiCards.totalUsageThisMonth),
                    paidTransactionsThisMonth: parseInt(kpiCards.paidTransactionsThisMonth, 10),
                    totalUnpaidBills: parseInt(kpiCards.totalUnpaidBills, 10),
                    customersWithDebt: parseInt(kpiCards.customersWithDebt, 10),
                    customersNotBilledThisMonth: parseInt(kpiCards.customersNotBilledThisMonth, 10),
                    customersWithOverdueBills: parseInt(kpiCards.customersWithOverdueBills, 10),
                    totalDebt: parseFloat(kpiCards.totalDebt),
                    totalBillsThisMonth: parseInt(kpiCards.totalBillsThisMonth, 10),
                    totalPaymentsThisMonth: parseFloat(kpiCards.totalPaymentsThisMonth)
                },
                revenueChart: {
                    labels: chartData.map(d => d.monthLabel),
                    series: [{ name: "Pendapatan", data: chartData.map(d => parseFloat(d.monthlyRevenue)) }],
                    summary: {
                        totalRevenue: totalChartRevenue,
                        monthlyAverage: parseFloat(monthlyAverage.toFixed(0))
                    }
                }
            };

            res.json({ success: true, data: responseData });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil data dasbor.', error: error.message });
        }
    }
}

module.exports = PetugasDashboardController;