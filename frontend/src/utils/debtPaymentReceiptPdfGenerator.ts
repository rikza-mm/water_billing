import jsPDF from 'jspdf';
import { formatRupiah } from './formatters';

// Interface tidak perlu diubah
export interface DebtCustomerData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  saldo: number;
  hutang: number;
}
export interface DebtPaymentData {
  paymentId?: string;
  amount: number;
  method: 'cash' | 'transfer' | 'qris';
  timestamp: string;
  status: 'completed';
  proofImage?: string;
  paymentType: 'debt';
  newBalance?: number;
  newDebt?: number;
  officerName?: string;
}


export function generateDebtPaymentReceiptPdf(
  customer: DebtCustomerData,
  payment: DebtPaymentData,
  mode: 'print' | 'download' | 'blob' = 'download'
): void | Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, 140] }); // Tinggikan struk sedikit
  const margin = 4;
  let y = 8;

  // --- 1. Perhitungan Data Cerdas ---
  const numericAmount = Number(payment.amount) || 0;
  const numericNewDebt = Number(payment.newDebt);

  const previousDebt = (payment.newDebt !== undefined && payment.newDebt !== null)
    ? numericAmount + numericNewDebt
    : undefined;

  const finalDebt = payment.newDebt ?? customer.hutang;
  const paymentStatus = finalDebt <= 0 ? 'LUNAS' : 'BAYAR SEBAGIAN';

  // --- 2. Layout & Konten Profesional ---

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ARTESIS TIRTA MUNA', 29, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Bukti Pembayaran Hutang', 29, y, { align: 'center' });
  y += 5;
  doc.line(margin, y, 58 - margin, y);
  y += 4;

  // Info Pelanggan & Transaksi
  const addInfoLine = (label: string, value: string) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 58 - margin, y, { align: 'right' });
    y += 4;
  };
  
  addInfoLine('Waktu', new Date(payment.timestamp).toLocaleString('id-ID', { hour12: false }));
  if (payment.paymentId) addInfoLine('ID Transaksi', `#${payment.paymentId}`);
  addInfoLine('Pelanggan', customer.name);
  addInfoLine('Petugas', payment.officerName || '-');
  y += 2;

  // Garis Pemisah
  doc.line(margin, y, 58 - margin, y);
  y += 4;

  // Rincian Pembayaran
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RINCIAN PEMBAYARAN', margin, y);
  y += 4;

  if (typeof previousDebt === 'number') {
    addInfoLine('Hutang Sebelum', formatRupiah(previousDebt));
  }
  addInfoLine('Jumlah Bayar', formatRupiah(payment.amount));
  addInfoLine('Metode', payment.method.toUpperCase());
  addInfoLine('Status', paymentStatus);
  y += 2;

  // Garis Pemisah
  doc.line(margin, y, 58 - margin, y);
  y += 4;
  
  // Kondisi Keuangan Akhir
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('KONDISI KEUANGAN', margin, y);
  y += 4;

  addInfoLine('Sisa Hutang', formatRupiah(finalDebt));
  addInfoLine('Saldo Akhir', formatRupiah(payment.newBalance ?? customer.saldo));
  y += 4;

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Simpan struk ini sebagai bukti pembayaran yang sah.', 29, y, { align: 'center' });
  y += 3;
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 29, y, { align: 'center' });

  // --- Eksekusi ---
  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (mode === 'download') {
    doc.save(`struk-pembayaran-hutang-${customer.id}-${payment.paymentId || ''}.pdf`);
  } else if (mode === 'blob') {
    return doc.output('blob');
  }
}