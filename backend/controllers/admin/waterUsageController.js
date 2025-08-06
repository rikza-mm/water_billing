const { validationResult } = require('express-validator');
const WaterUsageModel = require('../../models/admin/waterUsageModel');

class WaterUsageController {

    static async getWaterUsageData(req, res) {
        try {
            const { start_date, end_date } = req.body;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'Tanggal awal dan akhir diperlukan.' });
            }

            const [
                usageSummary,
                monthlyUsageTrend,
                usageByArea,
                customerUsageAnalysis
            ] = await Promise.all([
                WaterUsageModel.getUsageSummary(start_date, end_date),
                WaterUsageModel.getMonthlyUsageTrend(),
                WaterUsageModel.getUsageByArea(start_date, end_date),
                WaterUsageModel.getCustomerUsageAnalysis(start_date, end_date)
            ]);

            const responseData = {
                usageSummary,
                monthlyUsageTrend,
                usageByArea,
                customerUsageAnalysis
            };

            res.status(200).json({ success: true, data: responseData });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data analisis pemakaian air.' });
        }
    }

    static async recordUsage(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { customerId, usageAmount, usageDate } = req.body;
            const newUsageRecord = await WaterUsageModel.create({
                customerId,
                usageAmount,
                usageDate
            });

            res.status(201).json({ success: true, data: newUsageRecord });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mencatat pemakaian air.' });
        }
    }

    static async getUsageById(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const usageRecord = await WaterUsageModel.findById(id);

            if (!usageRecord) {
                return res.status(404).json({ success: false, message: 'Data pemakaian air tidak ditemukan.' });
            }

            res.status(200).json({ success: true, data: usageRecord });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data pemakaian air.' });
        }
    }
}

module.exports = WaterUsageController;
