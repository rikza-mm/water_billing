import { formatRupiah } from './formatters';

interface CustomerData {
  id: string;
  name: string;
  address: string;
  meterNumber: string;
  lastReading: number;
  phoneNumber?: string;
}

interface MeterReading {
  customerId: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  billAmount: number;
  readingDate: string;
  notes?: string;
}

interface Payment {
  method: 'cash' | 'transfer' | 'qris' | 'balance' | 'mixed';
  amount: number;
  status: 'pending' | 'completed';
  timestamp: string;
  useBalance?: boolean;
  balanceUsed?: number;
  priority?: 'current_first' | 'debt_first' | 'balance_optimize';
  allocation?: {
    debt_paid: number;
    current_bill_paid: number;
    excess_amount: number;
  };
  summary?: {
    total_allocated: number;
    bills_affected: number;
    debt_reduction: number;
    excess_to_balance: number;
    balance_utilized?: number;
  };
  note?: string;
}

// Helper untuk format angka meter
const formatMeter = (value: number) => Number.isInteger(value) ? value : parseFloat(value.toString());

// Function untuk generate PDF struk pembayaran yang proper
export const generateReceiptPDF = async (
  customer: CustomerData,
  meterReading: MeterReading,
  payment: Payment
): Promise<void> => {
  try {
    // Dynamic import jsPDF untuk menghindari SSR issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Thermal printer size (80mm width)
    });

    // Set font
    doc.setFont('helvetica');

    let yPosition = 10;
    const lineHeight = 4;
    const pageWidth = 80;
    const margin = 5;

    // Helper function untuk add text dengan word wrap
    const addText = (text: string, fontSize: number = 8, align: 'left' | 'center' | 'right' = 'left') => {
      doc.setFontSize(fontSize);

      if (align === 'center') {
        doc.text(text, pageWidth / 2, yPosition, { align: 'center' });
      } else if (align === 'right') {
        doc.text(text, pageWidth - margin, yPosition, { align: 'right' });
      } else {
        doc.text(text, margin, yPosition);
      }

      yPosition += lineHeight;
    };

    // Helper function untuk add line separator
    const addSeparator = () => {
      doc.setLineWidth(0.1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;
    };

    // Header
    addText('STRUK PEMBAYARAN AIR', 10, 'center');
    addText('ARTESIS TIRTA MUNA', 9, 'center');
    addSeparator();

    // Transaction info
    const transactionDate = new Date(payment.timestamp).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    addText(`Tanggal: ${transactionDate}`, 8);
    addText(`ID Transaksi: TRX${new Date(payment.timestamp).getTime()}`, 8);
    addSeparator();

    // Customer info
    addText('PELANGGAN:', 9);
    addText(`Nama: ${customer.name}`, 8);
    addText(`ID: ${customer.id}`, 8);
    addText(`Alamat: ${customer.address}`, 8);
    addText(`No. Meter: ${customer.meterNumber}`, 8);
    addSeparator();

    // Meter reading info
    addText('PEMBACAAN METER:', 9);
    addText(`Meter Sebelumnya: ${formatMeter(meterReading.previousReading)} m³`, 8);
    addText(`Meter Saat Ini: ${formatMeter(meterReading.currentReading)} m³`, 8);
    addText(`Pemakaian: ${formatMeter(meterReading.usage)} m³`, 8);
    addSeparator();

    // Payment info
    addText('PEMBAYARAN:', 9);

    // Method display
    let methodDisplay = '';
    switch (payment.method) {
      case 'cash': methodDisplay = 'TUNAI'; break;
      case 'transfer': methodDisplay = 'TRANSFER BANK'; break;
      case 'qris': methodDisplay = 'QRIS'; break;
      case 'balance': methodDisplay = 'SALDO'; break;
      case 'mixed': methodDisplay = 'CAMPURAN'; break;
      default: methodDisplay = String(payment.method).toUpperCase();
    }
    addText(`Metode: ${methodDisplay}`, 8);

    // Payment details
    addText(`Total Tagihan: ${formatRupiah(meterReading.billAmount)}`, 8);

    if (payment.method === 'balance') {
      addText(`Dibayar dengan Saldo: ${formatRupiah(meterReading.billAmount)}`, 8);
      addText(`Cash Diperlukan: ${formatRupiah(0)}`, 8);
    } else if (payment.method === 'mixed' && payment.balanceUsed) {
      addText(`Cash: ${formatRupiah(payment.amount)}`, 8);
      addText(`Saldo Digunakan: ${formatRupiah(payment.balanceUsed)}`, 8);
      addText(`Total Dibayar: ${formatRupiah(payment.amount + payment.balanceUsed)}`, 8);
    } else {
      addText(`Jumlah Dibayar: ${formatRupiah(payment.amount)}`, 8);
    }

    addText(`Status: ${payment.status === 'completed' ? 'LUNAS' : 'PENDING'}`, 8);

    // Payment allocation if available
    if (payment.allocation) {
      addSeparator();
      addText('ALOKASI PEMBAYARAN:', 9);

      if (payment.allocation.debt_paid > 0) {
        addText(`• Pembayaran Hutang: ${formatRupiah(payment.allocation.debt_paid)}`, 8);
      }

      if (payment.allocation.current_bill_paid > 0) {
        addText(`• Tagihan Bulan Ini: ${formatRupiah(payment.allocation.current_bill_paid)}`, 8);
      }

      if (payment.allocation.excess_amount > 0) {
        addText(`• Kelebihan ke Saldo: ${formatRupiah(payment.allocation.excess_amount)}`, 8);
      }
    }

    // Summary if available
    if (payment.summary) {
      addSeparator();
      addText('RINGKASAN:', 9);
      addText(`Total Dialokasikan: ${formatRupiah(payment.summary.total_allocated)}`, 8);

      if (payment.summary.bills_affected > 1) {
        addText(`Tagihan Terpengaruh: ${payment.summary.bills_affected} tagihan`, 8);
      }

      if (payment.summary.debt_reduction > 0) {
        addText(`Pengurangan Hutang: ${formatRupiah(payment.summary.debt_reduction)}`, 8);
      }
    }

    // Note if available
    if (payment.note) {
      addSeparator();
      addText('CATATAN:', 9);
      addText(payment.note, 8);
    }

    addSeparator();
    addText('Terima kasih atas pembayaran Anda', 8, 'center');
    yPosition += lineHeight;
    addText(`Petugas: ${localStorage.getItem('userName') || 'Admin'}`, 8, 'center');

    // Save the PDF
    const fileName = `struk-pembayaran-${customer.id}-${new Date(payment.timestamp).getTime()}.pdf`;
    doc.save(fileName);

  } catch {

    // Fallback to text file if PDF generation fails
    generateTextReceipt(customer, meterReading, payment);
  }
};

// Fallback function untuk generate text receipt
export const generateTextReceipt = (
  customer: CustomerData,
  meterReading: MeterReading,
  payment: Payment
): void => {
  const receiptContent = `
STRUK PEMBAYARAN AIR
ARTESIS TIRTA MUNA
========================

Tanggal: ${new Date(payment.timestamp).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}

ID Transaksi: TRX${new Date(payment.timestamp).getTime()}

PELANGGAN:
Nama: ${customer.name}
ID: ${customer.id}
Alamat: ${customer.address}
No. Meter: ${customer.meterNumber}

PEMBACAAN METER:
Meter Sebelumnya: ${formatMeter(meterReading.previousReading)} m³
Meter Saat Ini: ${formatMeter(meterReading.currentReading)} m³
Pemakaian: ${formatMeter(meterReading.usage)} m³

PEMBAYARAN:
Metode: ${payment.method === 'cash' ? 'TUNAI' :
         payment.method === 'transfer' ? 'TRANSFER BANK' :
         payment.method === 'qris' ? 'QRIS' :
         payment.method === 'balance' ? 'SALDO' :
         payment.method === 'mixed' ? 'CAMPURAN' :
         String(payment.method).toUpperCase()}
Total Tagihan: ${formatRupiah(meterReading.billAmount)}
${payment.method === 'balance' ?
  `Dibayar dengan Saldo: ${formatRupiah(meterReading.billAmount)}
Cash Diperlukan: ${formatRupiah(0)}` :
  payment.method === 'mixed' && payment.balanceUsed ?
  `Cash: ${formatRupiah(payment.amount)}
Saldo Digunakan: ${formatRupiah(payment.balanceUsed)}
Total Dibayar: ${formatRupiah(payment.amount + payment.balanceUsed)}` :
  `Jumlah Dibayar: ${formatRupiah(payment.amount)}`}

${payment.allocation ? `
ALOKASI PEMBAYARAN:
${payment.allocation.debt_paid > 0 ? `• Pembayaran Hutang: ${formatRupiah(payment.allocation.debt_paid)}` : ''}
${payment.allocation.current_bill_paid > 0 ? `• Tagihan Bulan Ini: ${formatRupiah(payment.allocation.current_bill_paid)}` : ''}
${payment.allocation.excess_amount > 0 ? `• Kelebihan ke Saldo: ${formatRupiah(payment.allocation.excess_amount)}` : ''}
` : ''}

========================
Terima kasih atas pembayaran Anda

Petugas: ${localStorage.getItem('userName') || 'Admin'}
  `;

  // Create and download text file
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `struk-pembayaran-${customer.id}-${new Date(payment.timestamp).getTime()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Function untuk print receipt (untuk thermal printer)
export const printReceipt = (
  customer: CustomerData,
  meterReading: MeterReading,
  payment: Payment
): void => {
  // Create a temporary div for printing
  const printDiv = document.createElement('div');
  printDiv.innerHTML = `
    <div style="width: 80mm; font-family: monospace; font-size: 12px; line-height: 1.2;">
      <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
        <div style="font-size: 14px;">STRUK PEMBAYARAN AIR</div>
        <div>Artesis Tirta Muna</div>
        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
      </div>

      <div style="margin-bottom: 10px;">
        <div>Tanggal: ${new Date(payment.timestamp).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
        <div>ID Transaksi: TRX${new Date(payment.timestamp).getTime()}</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold;">PELANGGAN:</div>
        <div>Nama: ${customer.name}</div>
        <div>ID: ${customer.id}</div>
        <div>Alamat: ${customer.address}</div>
        <div>No. Meter: ${customer.meterNumber}</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold;">PEMBACAAN METER:</div>
        <div>Meter Sebelumnya: ${formatMeter(meterReading.previousReading)} m³</div>
        <div>Meter Saat Ini: ${formatMeter(meterReading.currentReading)} m³</div>
        <div>Pemakaian: ${formatMeter(meterReading.usage)} m³</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold;">PEMBAYARAN:</div>
        <div>Metode: ${payment.method === 'cash' ? 'TUNAI' :
                      payment.method === 'transfer' ? 'TRANSFER BANK' :
                      payment.method === 'qris' ? 'QRIS' :
                      payment.method === 'balance' ? 'SALDO' :
                      payment.method === 'mixed' ? 'CAMPURAN' :
                      String(payment.method).toUpperCase()}</div>
        <div>Total Tagihan: ${formatRupiah(meterReading.billAmount)}</div>
        ${payment.method === 'balance' ?
          `<div>Dibayar dengan Saldo: ${formatRupiah(meterReading.billAmount)}</div>
           <div>Cash Diperlukan: ${formatRupiah(0)}</div>` :
          payment.method === 'mixed' && payment.balanceUsed ?
          `<div>Cash: ${formatRupiah(payment.amount)}</div>
           <div>Saldo Digunakan: ${formatRupiah(payment.balanceUsed)}</div>
           <div>Total Dibayar: ${formatRupiah(payment.amount + payment.balanceUsed)}</div>` :
          `<div>Jumlah Dibayar: ${formatRupiah(payment.amount)}</div>`}
      </div>

      ${payment.allocation ? `
        <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold;">ALOKASI PEMBAYARAN:</div>
          ${payment.allocation.debt_paid > 0 ? `<div>• Pembayaran Hutang: ${formatRupiah(payment.allocation.debt_paid)}</div>` : ''}
          ${payment.allocation.current_bill_paid > 0 ? `<div>• Tagihan Bulan Ini: ${formatRupiah(payment.allocation.current_bill_paid)}</div>` : ''}
          ${payment.allocation.excess_amount > 0 ? `<div>• Kelebihan ke Saldo: ${formatRupiah(payment.allocation.excess_amount)}</div>` : ''}
        </div>
      ` : ''}

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <div style="text-align: center; margin-top: 10px;">
        <div>Terima kasih atas pembayaran Anda</div>
        <div style="margin-top: 5px;">Petugas: ${localStorage.getItem('userName') || 'Admin'}</div>
      </div>
    </div>
  `;

  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * { visibility: hidden; }
      .print-receipt, .print-receipt * { visibility: visible; }
      .print-receipt { position: absolute; left: 0; top: 0; }
      @page { size: 80mm auto; margin: 0; }
    }
  `;

  printDiv.className = 'print-receipt';
  document.head.appendChild(style);
  document.body.appendChild(printDiv);

  // Print and cleanup
  window.print();

  setTimeout(() => {
    document.body.removeChild(printDiv);
    document.head.removeChild(style);
  }, 1000);
};
