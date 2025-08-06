import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatDateLong } from './formatters';
import type { CustomerSearchResult as CustomerData } from '@/hooks/petugas/meter-reading/useCustomerSearch';
import type { MeterReading, Payment } from '@/app/petugas/meter-reading/page';

// --- TAMBAHAN: Logika Tarif disalin dari MeterReadingForm.tsx untuk konsistensi ---
const rateDetailsByCategory: { [key: number]: { rate_per_cubic: number; minimum_usage: number } } = {
  1: { rate_per_cubic: 5000, minimum_usage: 2 },  // Kategori 1: Rumah Tangga
  2: { rate_per_cubic: 3000, minimum_usage: 2 },  // Kategori 2: Sosial (Masjid)
  3: { rate_per_cubic: 3500, minimum_usage: 2 },  // Kategori 3: Sosial (Umum)
  4: { rate_per_cubic: 8000, minimum_usage: 10 }, // Kategori 4: Komersial
};
const DEFAULT_RATE_DETAILS = { rate_per_cubic: 5000, minimum_usage: 0 };
// --- Akhir Logika Tarif ---

export interface DebtPaymentReceiptData {
  paymentId?: string;
  amount: number;
  method: string;
  timestamp: string;
  officerName?: string;
  proofUrl?: string;
  newBalance?: number;
  newDebt?: number;
}

// Helper to get lastAutoTable.finalY in a type-safe way
function getLastAutoTableFinalY(doc: jsPDF): number {
  // @ts-expect-error: jspdf-autotable attaches lastAutoTable at runtime
  return doc.lastAutoTable?.finalY ?? 0;
}

// ✅ GANTI FUNGSI LAMA DENGAN YANG BARU INI
export const generateReceiptPdf = (
  customer: CustomerData,
  meterReading: MeterReading,
  payment: Payment,
  mode: 'print' | 'download' | 'blob' = 'download'
): void | Blob => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 180] 
  });

  const margin = 4;
  const maxWidth = 58 - (margin * 2);
  let y = 8;

  // --- Perhitungan Data ---
  const totalPaid = payment.amount + (payment.balanceUsed || 0);
  const excessAmount = Math.max(0, totalPaid - meterReading.billAmount);
  const tariffDetails = (customer.category_id && rateDetailsByCategory[customer.category_id])
    ? rateDetailsByCategory[customer.category_id]
    : DEFAULT_RATE_DETAILS;
  const tariffPerM3 = tariffDetails.rate_per_cubic;
  const minimumUsage = tariffDetails.minimum_usage;
  const actualUsage = meterReading.usage;

  // --- Helper Layout ---
  const addInfoLine = (label: string, value: string | undefined, options: { boldValue?: boolean } = {}) => {
    const valueStyle = options.boldValue ? 'bold' : 'normal';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, y);
    doc.setFont('helvetica', valueStyle);
    doc.text(value ?? '', 58 - margin, y, { align: 'right' });
    y += 4.5;
  };
  
  const addSectionTitle = (title: string) => {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title.toUpperCase(), 29, y, { align: 'center' });
    y += 3;
    doc.line(margin, y, 58 - margin, y);
    y += 4.5;
  };

  // --- Mulai Membuat Struk ---

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ARTESIS TIRTA MUNA', 29, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Bukti Pembayaran Tagihan Air', 29, y, { align: 'center' });
  y += 6;

  // Info Transaksi
  addInfoLine('Waktu', new Date(payment.timestamp).toLocaleString('id-ID', { hour12: false }));
  if (payment.paymentId) addInfoLine('ID Transaksi', `#${payment.paymentId}`);
  addInfoLine('Pelanggan', customer.name);
  addInfoLine('Alamat', customer.address);
  addInfoLine('Petugas', payment.officerName || 'Sistem');

  // Rincian Pemakaian
  addSectionTitle('Rincian Pemakaian');
  addInfoLine('Periode Tagihan', formatDateLong(meterReading.readingDate));
  addInfoLine('Meter Awal', `${meterReading.previousReading} m³`);
  addInfoLine('Meter Akhir', `${meterReading.currentReading} m³`);
  addInfoLine('Total Pemakaian', `${actualUsage} m³`, { boldValue: true });

  // Rincian Tarif
  addSectionTitle('Rincian Tarif');
  if (customer.category_name) {
    addInfoLine('Kategori Pelanggan', customer.category_name);
  }
  addInfoLine('Total Pemakaian', `${actualUsage} m³`);
  addInfoLine('Tarif per m³', `x ${formatRupiah(tariffPerM3)}`);

  if (actualUsage < minimumUsage) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(`(Tagihan dihitung dari pemakaian minimum ${minimumUsage} m³)`, 58 - margin, y, { align: 'right' });
    y += 3;
    doc.setTextColor(0);
  }
  
  y += 2;
  y += 4; 
  
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TAGIHAN', margin, y);
  doc.text(formatRupiah(meterReading.billAmount), 58 - margin, y, { align: 'right' });
  y += 4.5;

  // Rincian Pembayaran
  addSectionTitle('Rincian Pembayaran');
  if (payment.amount > 0) {
    addInfoLine(`Bayar (${payment.method})`, formatRupiah(payment.amount));
  }
  if (payment.balanceUsed && payment.balanceUsed > 0) {
    addInfoLine('Penggunaan Saldo', `- ${formatRupiah(payment.balanceUsed)}`);
  }
  
  // PERBAIKAN: Menggunakan @ts-expect-error untuk mengatasi error linting
  y += 1.5;
  // @ts-expect-error - Tipe jsPDF mungkin tidak menyertakan setLineDash
  doc.setLineDash([1, 1], 0); 
  //doc.line(margin + 20, y, 58 - margin, y);
  // @ts-expect-error - Tipe jsPDF mungkin tidak menyertakan setLineDash
  doc.setLineDash([], 0); 
  y += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DIBAYAR', margin, y);
  doc.text(formatRupiah(totalPaid), 58 - margin, y, { align: 'right' });
  y += 5;

  // Kondisi Keuangan Akhir
  addSectionTitle('Status Keuangan');
  if (excessAmount > 0) {
    addInfoLine('Kelebihan Bayar', formatRupiah(excessAmount));
  }
  addInfoLine('Sisa Hutang', formatRupiah(payment.newDebt ?? 0));
  addInfoLine('Saldo Akhir', formatRupiah(payment.newBalance ?? 0), { boldValue: true });
  
  // Footer
  y += 7;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Terima kasih! Simpan struk ini sebagai bukti pembayaran yang sah.', 29, y, { align: 'center', maxWidth: maxWidth });

  // Eksekusi
  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (mode === 'download') {
    doc.save(`struk-${customer.id}-${meterReading.billId}.pdf`);
  } else if (mode === 'blob') {
    return doc.output('blob');
  }
};


// ✅ FUNGSI BARU UNTUK STRUK PEMBAYARAN HUTANG
export const generateDebtReceiptPdf = (
  customer: CustomerData,
  payment: DebtPaymentReceiptData,
  autoPrint: boolean = false
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 140] // Ukuran kertas struk bisa lebih pendek
  });

  let finalY = 10;

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PDAM TIRTA SEJAHTERA', 40, finalY, { align: 'center' });
  finalY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Bukti Pembayaran Tunggakan', 40, finalY, { align: 'center' });
  finalY += 8;

  // --- INFO TRANSAKSI ---
  doc.line(5, finalY, 75, finalY);
  finalY += 5;
  autoTable(doc, {
    body: [
      ['Waktu', `: ${new Date(payment.timestamp).toLocaleString('id-ID')}`],
      ['ID Transaksi', `: #${payment.paymentId}`],
      ['Petugas', `: ${payment.officerName || 'Sistem'}`],
      ['Pelanggan', `: ${customer.name} (ID: ${customer.id})`],
    ],
    startY: finalY,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 0.5 },
    columnStyles: { 0: { fontStyle: 'bold' } },
  });
  finalY = getLastAutoTableFinalY(doc);

  // --- RINCIAN PEMBAYARAN HUTANG ---
  finalY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAIL PEMBAYARAN TUNGGAKAN', 40, finalY, { align: 'center' });
  finalY += 2;
  doc.line(5, finalY, 75, finalY);
  autoTable(doc, {
    startY: finalY,
    body: [
        ['Metode Bayar', payment.method.toUpperCase()],
        ['JUMLAH DIBAYAR', formatRupiah(payment.amount)],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });
  finalY = getLastAutoTableFinalY(doc);
  
  // --- KONDISI KEUANGAN AKHIR ---
  finalY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS KEUANGAN TERBARU', 40, finalY, { align: 'center' });
  finalY += 2;
  doc.line(5, finalY, 75, finalY);
  autoTable(doc, {
    startY: finalY,
    body: [
        ['Sisa Tunggakan', formatRupiah(payment.newDebt || 0)],
        ['Saldo Akhir', formatRupiah(payment.newBalance || 0)],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: { 1: { halign: 'right' } },
  });
  finalY = getLastAutoTableFinalY(doc);

  // --- FOOTER ---
  finalY += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Terima kasih telah melunasi tunggakan Anda.', 40, finalY, { align: 'center' });

  if (autoPrint) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`struk_hutang-${customer.id}-${payment.paymentId}.pdf`);
  }
};