import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Helper to get lastAutoTable.finalY in a type-safe way
function getLastAutoTableFinalY(doc: jsPDF): number {
  // @ts-expect-error: jspdf-autotable attaches lastAutoTable at runtime
  return doc.lastAutoTable?.finalY ?? 0;
}

// Define types for export data
export interface FinancialStats {
  total_income: number;
  total_expense: number;
  net_income: number;
  total_transactions: number;
  payment_methods: {
    cash: number;
    transfer: number;
    qris: number;
    balance: number;
  };
  categories: {
    bill_payment: number;
    balance_topup: number;
    installment_payment: number;
    operational: number;
    salary: number;
    other: number;
  };
  daily_overview: DailyOverview[];
}

export interface DailyOverview {
  date: string;
  income: number;
  expense: number;
  transactions: number;
}

export interface FinancialRecord {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method?: string;
  customer_name?: string;
  notes?: string;
  created_by?: string;
}

export interface CustomerBalance {
  customer_name: string;
  current_balance: number;
  current_debt: number;
  total_payments: number;
  last_payment_date?: string;
}

export interface ExportData {
  financialStats: FinancialStats;
  financialRecords: FinancialRecord[];
  customerBalances: CustomerBalance[];
  dateRange: {
    start: string;
    end: string;
  };
}

export class ExportService {
  /**
   * Export data ke Excel format
   */
  static async exportToExcel(data: ExportData, filename?: string) {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Ringkasan Keuangan
    const summarySheet = workbook.addWorksheet('Ringkasan');
    summarySheet.addRow(['LAPORAN KEUANGAN']);
    summarySheet.addRow(['Periode', `${data.dateRange.start} s/d ${data.dateRange.end}`]);
    summarySheet.addRow(['Tanggal Export', new Date().toLocaleDateString('id-ID')]);
    summarySheet.addRow([]);
    summarySheet.addRow(['RINGKASAN KEUANGAN']);
    summarySheet.addRow(['Total Pemasukan', this.formatCurrency(data.financialStats.total_income)]);
    summarySheet.addRow(['Total Pengeluaran', this.formatCurrency(data.financialStats.total_expense)]);
    summarySheet.addRow(['Keuntungan Bersih', this.formatCurrency(data.financialStats.net_income)]);
    summarySheet.addRow(['Total Transaksi', data.financialStats.total_transactions]);
    summarySheet.addRow([]);
    summarySheet.addRow(['METODE PEMBAYARAN']);
    summarySheet.addRow(['Tunai', this.formatCurrency(data.financialStats.payment_methods.cash)]);
    summarySheet.addRow(['Transfer', this.formatCurrency(data.financialStats.payment_methods.transfer)]);
    summarySheet.addRow(['QRIS', this.formatCurrency(data.financialStats.payment_methods.qris)]);
    summarySheet.addRow(['Saldo', this.formatCurrency(data.financialStats.payment_methods.balance)]);
    summarySheet.addRow([]);
    summarySheet.addRow(['KATEGORI PEMASUKAN']);
    summarySheet.addRow(['Pembayaran Tagihan', this.formatCurrency(data.financialStats.categories.bill_payment)]);
    summarySheet.addRow(['Top Up Saldo', this.formatCurrency(data.financialStats.categories.balance_topup)]);
    summarySheet.addRow(['Pembayaran Cicilan', this.formatCurrency(data.financialStats.categories.installment_payment)]);
    summarySheet.addRow(['Operasional', this.formatCurrency(data.financialStats.categories.operational)]);
    summarySheet.addRow(['Gaji', this.formatCurrency(data.financialStats.categories.salary)]);
    summarySheet.addRow(['Lainnya', this.formatCurrency(data.financialStats.categories.other)]);

    // Sheet 2: Detail Transaksi
    const transactionSheet = workbook.addWorksheet('Detail Transaksi');
    const transactionHeaders = [
      'No', 'Tanggal', 'Tipe', 'Jumlah', 'Deskripsi', 'Kategori', 
      'Metode Pembayaran', 'Customer', 'Catatan', 'Dibuat Oleh'
    ];
    transactionSheet.addRow(transactionHeaders);
    data.financialRecords.forEach((record, index) => {
      transactionSheet.addRow([
        index + 1,
        new Date(record.date).toLocaleDateString('id-ID'),
        record.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        this.formatCurrency(record.amount),
        record.description,
        this.getCategoryName(record.category),
        record.payment_method || '-',
        record.customer_name || '-',
        record.notes || '-',
        record.created_by || '-'
      ]);
    });

    // Sheet 3: Tren Harian
    const dailySheet = workbook.addWorksheet('Tren Harian');
    const dailyHeaders = ['Tanggal', 'Pemasukan', 'Pengeluaran', 'Keuntungan', 'Jumlah Transaksi'];
    dailySheet.addRow(dailyHeaders);
    data.financialStats.daily_overview.forEach((day: DailyOverview) => {
      dailySheet.addRow([
        new Date(day.date).toLocaleDateString('id-ID'),
        this.formatCurrency(day.income),
        this.formatCurrency(day.expense),
        this.formatCurrency(day.income - day.expense),
        day.transactions
      ]);
    });

    // Sheet 4: Saldo Customer
    const customerSheet = workbook.addWorksheet('Saldo Customer');
    const customerHeaders = [
      'No', 'Nama Customer', 'Saldo Saat Ini', 'Hutang Saat Ini', 
      'Total Pembayaran', 'Pembayaran Terakhir'
    ];
    customerSheet.addRow(customerHeaders);
    data.customerBalances.forEach((customer, index) => {
      customerSheet.addRow([
        index + 1,
        customer.customer_name,
        this.formatCurrency(customer.current_balance),
        this.formatCurrency(customer.current_debt),
        customer.total_payments,
        customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString('id-ID') : '-'
      ]);
    });

    // Download file
    const fileName = filename || `laporan-keuangan-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export data ke PDF format
   */
  static exportToPDF(data: ExportData, filename?: string) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('LAPORAN KEUANGAN', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Periode: ${data.dateRange.start} s/d ${data.dateRange.end}`, 20, 30);
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 20, 40);

    // Ringkasan Keuangan
    doc.setFontSize(14);
    doc.text('RINGKASAN KEUANGAN', 20, 60);
    
    const summaryData = [
      ['Total Pemasukan', this.formatCurrency(data.financialStats.total_income)],
      ['Total Pengeluaran', this.formatCurrency(data.financialStats.total_expense)],
      ['Keuntungan Bersih', this.formatCurrency(data.financialStats.net_income)],
      ['Total Transaksi', data.financialStats.total_transactions.toString()]
    ];

    ((doc as unknown) as { autoTable: (options: UserOptions) => void }).autoTable({
      startY: 70,
      head: [['Keterangan', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    });

    // Metode Pembayaran
    doc.setFontSize(14);
    doc.text('METODE PEMBAYARAN', 20, getLastAutoTableFinalY(doc) + 20);
    
    const paymentData = [
      ['Tunai', this.formatCurrency(data.financialStats.payment_methods.cash)],
      ['Transfer', this.formatCurrency(data.financialStats.payment_methods.transfer)],
      ['QRIS', this.formatCurrency(data.financialStats.payment_methods.qris)],
      ['Saldo', this.formatCurrency(data.financialStats.payment_methods.balance)]
    ];

    ((doc as unknown) as { autoTable: (options: UserOptions) => void }).autoTable({
      startY: getLastAutoTableFinalY(doc) + 30,
      head: [['Metode', 'Total']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
      margin: { left: 20, right: 20 }
    });

    // New page untuk detail transaksi
    doc.addPage();
    doc.setFontSize(14);
    doc.text('DETAIL TRANSAKSI', 20, 20);

    const transactionData = data.financialRecords.slice(0, 20).map((record, index) => [
      (index + 1).toString(),
      new Date(record.date).toLocaleDateString('id-ID'),
      record.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      this.formatCurrency(record.amount),
      record.description.substring(0, 30) + (record.description.length > 30 ? '...' : '')
    ]);

    ((doc as unknown) as { autoTable: (options: UserOptions) => void }).autoTable({
      startY: 30,
      head: [['No', 'Tanggal', 'Tipe', 'Jumlah', 'Deskripsi']],
      body: transactionData,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    });

    // Download file
    const fileName = filename || `laporan-keuangan-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Export data ke CSV format
   */
  static exportToCSV(data: ExportData, filename?: string) {
    const headers = [
      'No', 'Tanggal', 'Tipe', 'Jumlah', 'Deskripsi', 'Kategori', 
      'Metode Pembayaran', 'Customer', 'Catatan'
    ];
    
    const csvData = data.financialRecords.map((record, index) => [
      index + 1,
      new Date(record.date).toLocaleDateString('id-ID'),
      record.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      record.amount,
      `"${record.description}"`,
      this.getCategoryName(record.category),
      record.payment_method || '-',
      `"${record.customer_name || '-'}"`,
      `"${record.notes || '-'}"`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `transaksi-keuangan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Helper functions
   */
  private static formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  }

  private static getCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'bill_payment': 'Pembayaran Tagihan',
      'balance_topup': 'Top Up Saldo',
      'installment_payment': 'Pembayaran Cicilan',
      'operational': 'Operasional',
      'salary': 'Gaji',
      'maintenance': 'Pemeliharaan',
      'other': 'Lainnya'
    };
    return categoryMap[category] || category;
  }
}
