const FinancialModel = require('../../models/admin/financeModel');
const pool = require('../../config/db');

class FinanceController {

  /**
   * Mengambil semua data yang dibutuhkan untuk dasbor keuangan.
   */
  static async getDashboardData(req, res) {
    try {
      const { start_date, end_date } = req.body;
      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Tanggal awal dan akhir diperlukan.' });
      }
      const data = await FinancialModel.getDashboardData(start_date, end_date);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data dasbor.' });
    }
  }

  /**
   * Membuat transaksi keuangan umum (pemasukan/pengeluaran).
   */
  static async createTransaction(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const data = { ...req.body, created_by: req.user.id };
      
      // 1. Catat transaksi ke financials (seperti sebelumnya)
      const financialId = await FinancialModel.createTransaction(data, connection);

      // 2. LOGIKA BARU: Jika ini adalah pembelian aset, catat juga ke fixed_assets
      if (data.category === 'inv_beli_aset' && data.type === 'expense') {
        if (!data.asset_name) {
          throw new Error('Nama Aset wajib diisi untuk transaksi pembelian aset.');
        }
        const assetData = {
          asset_name: data.asset_name,
          acquisition_date: data.date,
          acquisition_cost: data.amount,
          description: data.description,
          related_financial_id: financialId
        };
        await FinancialModel.createFixedAsset(assetData, connection);
      }
      
      await connection.commit();
      
      await FinancialModel.triggerDailyReconciliation(data.date || new Date().toISOString().split('T')[0]);

      res.status(201).json({ success: true, message: 'Transaksi berhasil dibuat.' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ success: false, message: error.message || 'Gagal membuat transaksi.' });
    } finally {
      if (connection) connection.release();
    }
  }
  /**
   * Membuat transaksi ekuitas (Prive atau Setoran Modal).
   */
  static async createEquityTransaction(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const data = { ...req.body, created_by: req.user.id };

      // Validasi
      if (!['MODAL_AWAL', 'SETORAN_MODAL', 'PRIVE'].includes(data.type)) {
          return res.status(400).json({ success: false, message: 'Tipe transaksi modal tidak valid.' });
      }

      // 1. Catat ke tabel equity_transactions
      await FinancialModel.createEquityTransaction(data, connection);

      // 2. Buat catatan bayangan di financials untuk Arus Kas
      const financialData = {
        // ======================================================
        // ========= PERBAIKAN LOGIKA KRUSIAL ADA DI SINI =========
        // ======================================================
        type: (data.type === 'SETORAN_MODAL' || data.type === 'MODAL_AWAL') ? 'income' : 'expense',
        amount: data.amount,
        description: data.description,
        category: data.type.toLowerCase(),
        cashflow_classification: 'FINANCING',
        created_by: data.created_by,
        date: data.transaction_date,
      };
      await FinancialModel.createTransaction(financialData, connection);
      
      await connection.commit();

      await FinancialModel.triggerDailyReconciliation(data.transaction_date);

      res.status(201).json({ success: true, message: 'Transaksi modal berhasil dicatat.' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Gagal mencatat transaksi modal.' });
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Menjalankan proses "Tutup Buku" untuk sebuah periode.
   */
  static async closePeriod(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { start_date, end_date } = req.body;
      const result = await FinancialModel.closePeriod(start_date, end_date, req.user.id, connection);
      
      if (result.success) {
        await connection.commit();
      } else {
        await connection.rollback();
      }
      
      // Selalu kembalikan result dari stored procedure
      res.status(200).json(result);
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ success: false, message: error.message || 'Gagal menjalankan proses tutup buku.' });
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = FinanceController;