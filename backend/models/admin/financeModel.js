const pool = require('../../config/db');

class FinancialModel {

  // FUNGSI BARU: Untuk mengambil ringkasan pemasukan/pengeluaran harian
  static async getDailyOverview(startDate, endDate, connection = pool) {
    const [rows] = await connection.execute(`
      SELECT
        date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM financials
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC;
    `, [startDate, endDate]);
    return rows;
  }

  /**
   * Fungsi utama untuk mengambil semua data yang dibutuhkan oleh dasbor keuangan dalam satu panggilan.
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Promise<object>}
   */
  static async getDashboardData(startDate, endDate) {
    const connection = await pool.getConnection();
    try {
      const [
        incomeStatementData,
        cashFlowData,
        balanceSheet,
        equityTransactions,
        recentFinancials,
        dailyOverview // <-- TAMBAHKAN: Panggil fungsi baru
      ] = await Promise.all([
        this.getIncomeStatementData(startDate, endDate, connection),
        this.getCashFlowStatementData(startDate, endDate, connection),
        this.getBalanceSheet(endDate, connection),
        this.getEquityTransactions(startDate, endDate, connection),
        this.getTransactions(startDate, endDate, 20, connection),
        this.getDailyOverview(startDate, endDate, connection)
      ]);

      // Balance sheet sudah dihasilkan oleh stored procedure GenerateBalanceSheet
      
      return {
        incomeStatement: incomeStatementData,
        cashFlowStatement: cashFlowData,
        balanceSheet: balanceSheet,
        equityTransactions: equityTransactions,
        recentFinancials: recentFinancials,
        dailyOverview: dailyOverview // <-- TAMBAHKAN: Sertakan dalam respons
      };

    } finally {
      if (connection) connection.release();
    }
  }

  // --- Fungsi-fungsi CRUD Transaksi ---

  static async createTransaction(data, connection = pool) {
    const { type, amount, description, payment_id = null, category = null, cashflow_classification = 'OPERATING', notes = null, created_by, date } = data;
    const transactionDate = date ? date : new Date().toISOString().split('T')[0];
    const [result] = await connection.execute(
      `INSERT INTO financials (type, amount, description, payment_id, category, cashflow_classification, notes, created_by, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, parseFloat(amount), description, payment_id, category, cashflow_classification, notes, created_by, transactionDate]
    );
    return result.insertId;
  }

  static async createEquityTransaction(data, connection = pool) {
    const { transaction_date, type, amount, description, created_by } = data;
    const [result] = await connection.execute(
      `INSERT INTO equity_transactions (transaction_date, type, amount, description, created_by) VALUES (?, ?, ?, ?, ?)`,
      [transaction_date, type, parseFloat(amount), description, created_by]
    );
    return result.insertId;
  }
  
  static async getTransactions(startDate, endDate, limit = 1000, connection = pool) {
    const [rows] = await connection.query(`
        SELECT f.*, u.full_name as created_by_name, p.method as payment_method, c.full_name as customer_name
        FROM financials f
        LEFT JOIN users u ON f.created_by = u.user_id
        LEFT JOIN payments p ON f.payment_id = p.payment_id
        LEFT JOIN customers c ON p.customer_id = c.customer_id
        WHERE f.date BETWEEN ? AND ? ORDER BY f.date DESC, f.id DESC LIMIT ?
    `, [startDate, endDate, limit]);
    return rows;
  }

  // --- Fungsi-fungsi Helper untuk Laporan ---
static async getIncomeStatementData(startDate, endDate, connection = pool) {
    const [stats] = await connection.execute(`
      SELECT
        -- ======================================================
        -- ========= PERBAIKAN LOGIKA ADA DI BARIS INI =========
        -- ======================================================
        COALESCE(SUM(CASE WHEN f.type = 'income' AND f.cashflow_classification IN ('OPERATING', 'INVESTING') THEN f.amount ELSE 0 END), 0) as total_pendapatan,
        
        COALESCE(SUM(CASE WHEN f.type = 'expense' AND f.category LIKE 'hpp_%' THEN f.amount ELSE 0 END), 0) as total_hpp,
        
        COALESCE(SUM(CASE WHEN f.type = 'expense' AND f.category LIKE 'ops_%' THEN f.amount ELSE 0 END), 0) as total_biaya_operasional,
        
        (SELECT COALESCE(SUM(amount), 0) FROM equity_transactions 
         WHERE type = 'PRIVE' AND transaction_date BETWEEN ? AND ?) as prive_pemilik
         
      FROM financials f
      WHERE f.date BETWEEN ? AND ?
    `, [startDate, endDate, startDate, endDate]);

    const data = stats[0];
    const laba_kotor = parseFloat(data.total_pendapatan) - parseFloat(data.total_hpp);
    const laba_operasional = laba_kotor - parseFloat(data.total_biaya_operasional);
    
    const laba_bersih_sebelum_prive = laba_operasional;
    const laba_bersih_setelah_prive = laba_bersih_sebelum_prive - parseFloat(data.prive_pemilik);

    return {
      pendapatan_penjualan: parseFloat(data.total_pendapatan),
      total_hpp: parseFloat(data.total_hpp),
      laba_kotor: laba_kotor,
      total_biaya_operasional: parseFloat(data.total_biaya_operasional),
      laba_operasional: laba_operasional,
      pendapatan_lain: 0,
      biaya_lain: 0,
      laba_sebelum_pajak: laba_bersih_sebelum_prive,
      pajak_usaha: 0,
      laba_bersih_sebelum_prive: laba_bersih_sebelum_prive,
      prive_pemilik: parseFloat(data.prive_pemilik),
      laba_bersih_setelah_prive: laba_bersih_setelah_prive
    };
 }

  static async getCashFlowStatementData(startDate, endDate, connection = pool) {
    const [summary] = await connection.execute(`
        SELECT 
            cashflow_classification,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_inflow,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_outflow
        FROM financials 
        WHERE date BETWEEN ? AND ?
        GROUP BY cashflow_classification
    `, [startDate, endDate]);

    const [details] = await connection.execute(`
        SELECT description, amount, type, cashflow_classification, date 
        FROM financials 
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC
    `, [startDate, endDate]);
    
    return { summary, details };
  }

  /**
   * Memanggil Stored Procedure untuk menghasilkan Laporan Neraca secara utuh.
   * @param {string} endDate
   * @param {object} connection - Database connection (optional)
   * @returns {object} Objek Laporan Neraca.
   */
  static async getBalanceSheet(endDate, connection = pool) {
    const [rows] = await connection.execute('CALL GenerateBalanceSheet(?)', [endDate]);
    return JSON.parse(rows[0][0].balance_sheet);
  }
  
  static async getLatestCashBalances(endDate, connection = pool) {
    // Menghitung total saldo kas dari berbagai sumber
    const [cashData] = await connection.execute(`
      SELECT
        COALESCE(SUM(CASE
          WHEN type = 'income' THEN amount
          WHEN type = 'expense' THEN -amount
          ELSE 0
        END), 0) as total_balance
      FROM financials
      WHERE date <= ? AND cashflow_classification = 'OPERATING'
    `, [endDate]);

    return {
      total_balance: parseFloat(cashData[0].total_balance) || 0
    };
  }

  static async getCustomerDebtsAndBalances(connection = pool) {
    // Menghitung total piutang dan kewajiban dari customer
    const [customerData] = await connection.execute(`
      SELECT
        COALESCE(SUM(hutang), 0) as total_receivables,
        COALESCE(SUM(saldo), 0) as total_liabilities
      FROM customers
      WHERE status = 'active'
    `);

    return {
      total_receivables: parseFloat(customerData[0].total_receivables) || 0,
      total_liabilities: parseFloat(customerData[0].total_liabilities) || 0
    };
  }



  static async getEquityTransactions(startDate, endDate, connection = pool) {
    const [rows] = await connection.execute(
      // TAMBAHKAN "eq.equity_transaction_id as id"
      `SELECT eq.equity_transaction_id as id, eq.*, u.full_name as created_by_name 
       FROM equity_transactions eq
       LEFT JOIN users u ON eq.created_by = u.user_id
       WHERE eq.transaction_date BETWEEN ? AND ? ORDER BY eq.transaction_date DESC`,
      [startDate, endDate]
    );
    return rows;
  }
  // --- Fungsi untuk Memanggil Stored Procedure ---

  static async closePeriod(startDate, endDate, userId, connection = pool) {
    await connection.query('CALL ClosePeriodAndRecordRetainedEarnings(?, ?, ?, @result);', [startDate, endDate, userId]);
    const [resultRows] = await connection.query('SELECT @result AS result;');
    return JSON.parse(resultRows[0].result);
  }

  static async triggerDailyReconciliation(date, connection = pool) {
    await connection.query("CALL ReconcileDailyBalance(?);", [date]);
  }

    /**
   * Menyimpan data aset tetap baru.
   * @param {object} data - Data aset { name, date, cost, description, financial_id }
   * @param {object} connection - Koneksi database aktif untuk transaksi
   * @returns {number} ID aset baru
   */
  static async createFixedAsset(data, connection = pool) {
    const { asset_name, acquisition_date, acquisition_cost, description, related_financial_id } = data;
    const [result] = await connection.execute(
      `INSERT INTO fixed_assets (asset_name, acquisition_date, acquisition_cost, description, related_financial_id) VALUES (?, ?, ?, ?, ?)`,
      [asset_name, acquisition_date, acquisition_cost, description, related_financial_id]
    );
    return result.insertId;
  }

}

module.exports = FinancialModel;