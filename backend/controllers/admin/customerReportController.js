const CustomerReportModel = require('../../models/admin/customerReportModel');

class CustomerReportController {
  static async getAnalytics(req, res) {
    try {
      const analyticsData = await CustomerReportModel.getCustomerAnalytics();
      res.status(200).json({
        success: true,
        data: analyticsData
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data analisis pelanggan.' });
    }
  }
}

module.exports = CustomerReportController;