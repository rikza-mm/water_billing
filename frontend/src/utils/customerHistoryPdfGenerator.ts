// frontend/src/utils/customerHistoryPdfGenerator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatDateLong } from './formatters';
import type { CustomerSearchResult } from '@/hooks/petugas/meter-reading/useCustomerSearch';
import type { CustomerHistoryData } from '@/services/customerHistoryService';

// Helper function untuk mendapatkan finalY dari autoTable
function getLastAutoTableFinalY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
}

export const generateCustomerHistoryPdf = (
  customer: CustomerSearchResult,
  historyData: CustomerHistoryData,
  mode: 'print' | 'download' | 'blob' = 'download'
): void | Blob => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let finalY = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RIWAYAT PELANGGAN PDAM', 105, finalY, { align: 'center' });
  finalY += 8;
  doc.setFontSize(12);
  doc.text('TIRTA SEJAHTERA', 105, finalY, { align: 'center' });
  finalY += 15;

  // Info Pelanggan
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI PELANGGAN:', 20, finalY);
  finalY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${customer.name}`, 20, finalY);
  finalY += 4;
  doc.text(`ID: ${customer.id}`, 20, finalY);
  finalY += 4;
  doc.text(`Alamat: ${customer.address}`, 20, finalY);
  finalY += 4;
  doc.text(`No. Meter: ${customer.meterNumber || '-'}`, 20, finalY);
  finalY += 4;
  doc.text(`No. Telepon: ${customer.phoneNumber || '-'}`, 20, finalY);
  finalY += 8;

  // Ringkasan Keuangan
  if (historyData.financialSummary) {
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN:', 20, finalY);
    finalY += 6;
    autoTable(doc, {
      startY: finalY,
      head: [['Item', 'Jumlah']],
      body: [
        ['Saldo', formatRupiah(historyData.financialSummary.saldo)],
        ['Hutang', formatRupiah(historyData.financialSummary.hutang)],
        ['Total Tagihan', formatRupiah(historyData.detailedHistory.reduce((sum, item) => sum + Number(item.amount), 0))],
        ['Total Dibayar', formatRupiah(historyData.detailedHistory.reduce((sum, item) => sum + Number(item.paid_amount), 0))],
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      styles: { fontSize: 9 },
    });
    finalY = getLastAutoTableFinalY(doc) + 10;
  }

  // Statistik Pemakaian
  if (historyData.detailedHistory.length > 0) {
    const totalUsage = historyData.detailedHistory.reduce((sum, item) => sum + Number(item.water_usage), 0);
    const avgUsage = totalUsage / historyData.detailedHistory.length;
    const maxUsage = Math.max(...historyData.detailedHistory.map(item => Number(item.water_usage)));
    const minUsage = Math.min(...historyData.detailedHistory.map(item => Number(item.water_usage)));

    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIK PEMAKAIAN:', 20, finalY);
    finalY += 6;
    autoTable(doc, {
      startY: finalY,
      head: [['Metrik', 'Nilai']],
      body: [
        ['Total Periode', `${historyData.detailedHistory.length} bulan`],
        ['Total Pemakaian', `${totalUsage.toFixed(1)} m³`],
        ['Rata-rata Bulanan', `${avgUsage.toFixed(1)} m³`],
        ['Pemakaian Tertinggi', `${maxUsage} m³`],
        ['Pemakaian Terendah', `${minUsage} m³`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      styles: { fontSize: 9 },
    });
    finalY = getLastAutoTableFinalY(doc) + 10;
  }

  // Riwayat Tagihan & Pembacaan Meter (Digabungkan)
  if (historyData.detailedHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('RIWAYAT TAGIHAN & PEMBACAAN METER:', 20, finalY);
    finalY += 6;
    
    const tableData = historyData.detailedHistory.map(item => [
      formatDateLong(item.period_start),
      item.meter_reading ? `${item.meter_reading.previous_reading} m³` : '-',
      item.meter_reading ? `${item.meter_reading.current_reading} m³` : '-',
      `${Number(item.water_usage)} m³`,
      formatRupiah(Number(item.amount)),
      formatRupiah(Number(item.paid_amount)),
      item.bill_status === 'paid' ? 'Lunas' : 
      item.bill_status === 'partial' ? 'Cicilan' : 'Belum Bayar',
      item.meter_reading ? item.meter_reading.reading_officer : '-'
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [['Periode', 'Meter Awal', 'Meter Akhir', 'Pemakaian', 'Tagihan', 'Dibayar', 'Status', 'Petugas Baca']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      styles: { fontSize: 7 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' },
        7: { halign: 'center' }
      }
    });
    finalY = getLastAutoTableFinalY(doc) + 10;
  }

  // Riwayat Pembayaran Hutang
  if (historyData.debtHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('RIWAYAT PEMBAYARAN HUTANG:', 20, finalY);
    finalY += 6;
    
    const debtTableData = historyData.debtHistory.map(item => [
      formatDateLong(item.transaction_date),
      formatRupiah(Number(item.total_payment_amount)),
      item.method.toUpperCase(),
      item.officer_name,
      `${item.allocations.length} tagihan`
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [['Tanggal', 'Jumlah', 'Metode', 'Petugas', 'Alokasi']],
      body: debtTableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      }
    });
    finalY = getLastAutoTableFinalY(doc) + 10;
  }

  // Footer
  finalY = getLastAutoTableFinalY(doc) + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Dokumen ini dibuat otomatis oleh sistem PDAM Tirta Sejahtera', 105, finalY, { align: 'center' });
  finalY += 4;
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 105, finalY, { align: 'center' });

  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (mode === 'download') {
    doc.save(`riwayat-pelanggan-${customer.id}-${new Date().toISOString().split('T')[0]}.pdf`);
  } else if (mode === 'blob') {
    return doc.output('blob');
  }
};

// Fungsi untuk generate PDF struk pembayaran hutang
export function generateDebtPaymentReceiptPdf(
  customer: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    saldo: number;
    hutang: number;
  },
  payment: {
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
  },
  mode: 'print' | 'download' | 'blob' = 'print'
) {
  // Gunakan jsPDF atau PDFMake, atau window.print untuk mode print
  // Contoh sederhana dengan window.print (untuk mode 'print')
  if (mode === 'print') {
    // Render HTML struk ke window baru dan panggil print
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Struk Pembayaran Hutang</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        .header { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        .label { color: #666; min-width: 120px; display: inline-block; }
        .value { font-weight: bold; }
        .table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        .table th, .table td { border: 1px solid #ccc; padding: 8px; }
        .table th { background: #f0f0f0; }
      </style>
      </head><body>
      <div class="header">Struk Pembayaran Hutang</div>
      <div class="section">
        <span class="label">Nama:</span> <span class="value">${customer.name}</span><br/>
        <span class="label">ID Pelanggan:</span> <span class="value">${customer.id}</span><br/>
        <span class="label">Alamat:</span> <span class="value">${customer.address}</span><br/>
        <span class="label">No. HP:</span> <span class="value">${customer.phone || '-'}</span><br/>
      </div>
      <div class="section">
        <span class="label">Tanggal Bayar:</span> <span class="value">${new Date(payment.timestamp).toLocaleString('id-ID')}</span><br/>
        <span class="label">Jumlah Bayar:</span> <span class="value">Rp ${Number(payment.amount).toLocaleString('id-ID')}</span><br/>
        <span class="label">Metode:</span> <span class="value">${payment.method}</span><br/>
        <span class="label">Petugas:</span> <span class="value">${payment.officerName || '-'}</span><br/>
      </div>
      <div class="section">
        <span class="label">Sisa Hutang:</span> <span class="value">Rp ${Number(payment.newDebt ?? 0).toLocaleString('id-ID')}</span><br/>
        <span class="label">Saldo Terakhir:</span> <span class="value">Rp ${Number(payment.newBalance ?? 0).toLocaleString('id-ID')}</span><br/>
      </div>
      <div class="section" style="margin-top:32px; color:#888; font-size:13px;">Terima kasih atas pembayaran Anda.<br/>PDAM Tirta Sejahtera</div>
      </body></html>
    `);
    win.document.close();
    win.print();
    return;
  }
  if (mode === 'blob') {
    // Sederhana: return Blob dari HTML (bisa diganti ke PDF generator)
    const html = `
      <html><head><title>Struk Pembayaran Hutang</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        .header { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        .label { color: #666; min-width: 120px; display: inline-block; }
        .value { font-weight: bold; }
        .table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        .table th, .table td { border: 1px solid #ccc; padding: 8px; }
        .table th { background: #f0f0f0; }
      </style>
      </head><body>
      <div class="header">Struk Pembayaran Hutang</div>
      <div class="section">
        <span class="label">Nama:</span> <span class="value">${customer.name}</span><br/>
        <span class="label">ID Pelanggan:</span> <span class="value">${customer.id}</span><br/>
        <span class="label">Alamat:</span> <span class="value">${customer.address}</span><br/>
        <span class="label">No. HP:</span> <span class="value">${customer.phone || '-'}</span><br/>
      </div>
      <div class="section">
        <span class="label">Tanggal Bayar:</span> <span class="value">${new Date(payment.timestamp).toLocaleString('id-ID')}</span><br/>
        <span class="label">Jumlah Bayar:</span> <span class="value">Rp ${Number(payment.amount).toLocaleString('id-ID')}</span><br/>
        <span class="label">Metode:</span> <span class="value">${payment.method}</span><br/>
        <span class="label">Petugas:</span> <span class="value">${payment.officerName || '-'}</span><br/>
      </div>
      <div class="section">
        <span class="label">Sisa Hutang:</span> <span class="value">Rp ${Number(payment.newDebt ?? 0).toLocaleString('id-ID')}</span><br/>
        <span class="label">Saldo Terakhir:</span> <span class="value">Rp ${Number(payment.newBalance ?? 0).toLocaleString('id-ID')}</span><br/>
      </div>
      <div class="section" style="margin-top:32px; color:#888; font-size:13px;">Terima kasih atas pembayaran Anda.<br/>PDAM Tirta Sejahtera</div>
      </body></html>
    `;
    return new Blob([html], { type: 'application/pdf' });
  }
  return null;
}