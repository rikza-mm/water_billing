const AnalystModel = require('../../models/admin/analystModel');
const { validationResult } = require('express-validator');

class AnalystController {

    /**
     * FUNGSI BARU: Mengambil data detail untuk halaman analisis petugas.
     */
    static async getOfficerDetail(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
        }
        try {
            const { officerId } = req.params;
            const { start_date, end_date } = req.body;

            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'Tanggal awal dan akhir diperlukan.' });
            }

            const data = await AnalystModel.getOfficerDetail(officerId, start_date, end_date);

            if (!data) {
                return res.status(404).json({ success: false, message: 'Data petugas tidak ditemukan.' });
            }

            res.status(200).json({ success: true, data });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data detail petugas.' });
        }
    }

    /**
     * Mengambil semua data untuk Dasbor Analis.
     */
    static async getAnalystDashboardData(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
        }
        try {
            const { start_date, end_date } = req.body;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'Tanggal awal dan akhir diperlukan.' });
            }

            // Panggil semua metode dari model secara paralel untuk efisiensi
            const [
                overallSummary,
                officerLeaderboard,
                areaPerformance,
                topDefaulters,
                longestOverdueCustomers,
                zeroUsageCustomers,
                notBilledCustomers
            ] = await Promise.all([
                AnalystModel.getOverallSummary(start_date, end_date),
                AnalystModel.getOfficerLeaderboard(start_date, end_date),
                AnalystModel.getAreaPerformance(start_date, end_date),
                AnalystModel.getTopDefaulters(),
                AnalystModel.getLongestOverdueCustomers(),
                AnalystModel.getZeroUsageCustomers(),
                AnalystModel.getNotBilledCustomers()
            ]);

            // Susun data dalam satu objek respons
            const dashboardData = {
                overallSummary,
                officerLeaderboard,
                areaPerformance,
                // Gabungkan daftar pelanggan "perlu perhatian" ke dalam satu objek
                customerActionLists: {
                    topDefaulters,
                    longestOverdueCustomers,
                    zeroUsageCustomers,
                    notBilledCustomers
                }
            };

            res.status(200).json({ success: true, data: dashboardData });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data dasbor analis.' });
        }
    }

    /**
     * FUNGSI BARU: Mengambil data ledger untuk halaman analisis pelanggan.
     */
    static async getCustomerLedger(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: "Input tidak valid.", errors: errors.array() });
        }
        try {
            const { customerId } = req.params;
            const data = await AnalystModel.getCustomerLedger(customerId);

            if (!data) {
                return res.status(404).json({ success: false, message: 'Data pelanggan tidak ditemukan.' });
            }

            res.status(200).json({ success: true, data });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data ledger pelanggan.' });
        }
    }
}

module.exports = AnalystController;