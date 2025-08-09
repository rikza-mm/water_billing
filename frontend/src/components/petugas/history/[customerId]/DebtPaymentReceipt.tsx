'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Download, Printer, MessageCircle, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import { useDocument } from '@/hooks/petugas/useDocument';
import type { DebtPaymentData } from '@/utils/debtPaymentReceiptPdfGenerator';

export interface DebtCustomerData {
  id: string;
  name: string;
  address: string;
  saldo: number;
  hutang: number;
  phone?: string;
}

interface DebtPaymentReceiptProps {
  customer: DebtCustomerData;
  payment: DebtPaymentData;
  onFinish: () => void;
}

export default function DebtPaymentReceipt({ customer, payment, onFinish }: DebtPaymentReceiptProps) {
  const { isLoading: isFetchingUrl, fetchDocumentUrl } = useDocument();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Konversi nilai ke number sebelum perhitungan
  const numericAmount = Number(payment.amount) || 0;
  const numericNewDebt = Number(payment.newDebt);
  const previousDebt = (payment.newDebt !== undefined && payment.newDebt !== null)
    ? numericAmount + numericNewDebt
    : undefined;

  useEffect(() => {
    if (payment.paymentId) {
      fetchDocumentUrl(payment.paymentId, 'receipt').then(url => {
        if (url) setReceiptUrl(url);
      });
    }
  }, [payment.paymentId, fetchDocumentUrl]);

  const openReceiptUrl = () => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.error('URL Struk tidak tersedia. Coba lagi.');
    }
  };

  // Cetak struk
  const handlePrint = () => {
    openReceiptUrl();
  };
  // Download struk
  const handleDownload = () => {
    openReceiptUrl();
  };
  // Share WhatsApp
  const handleShareWhatsApp = async () => {
    if (!customer.phone) {
      toast.error('Nomor WhatsApp pelanggan tidak tersedia.');
      return;
    }
    if (!receiptUrl) {
      toast.error('Harap tunggu hingga URL struk selesai dimuat.');
      return;
    }
    const message = `Yth. Bpk/Ibu ${customer.name},\n\nBerikut adalah bukti pembayaran hutang air Anda:\n${receiptUrl}\n\nTerima kasih.\n\nSalam,\nTirta Muna`;
    const encodedMessage = encodeURIComponent(message);
    const formattedPhone = customer.phone.replace(/^0/, '62');
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // ✅ DIV terluar sudah menjadi konten murni dengan padding, tanpa styling modal.
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800 mt-3">Pembayaran Hutang Berhasil</h2>
        <p className="text-sm text-gray-600">
          {new Date(payment.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {/* Rincian Pembayaran */}
      <div className="space-y-3 text-sm border-t border-b border-gray-200/80 py-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Pelanggan</span>
          <span className="font-semibold text-gray-800">{customer.name}</span>
        </div>
        {/* Tambahan: Hutang Sebelum Pembayaran */}
        <div className="flex justify-between">
          <span className="text-gray-600">Hutang Sebelum</span>
          <span className="font-semibold text-gray-800">
            {typeof previousDebt === 'number'
              ? formatRupiah(previousDebt)
              : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Jumlah Bayar</span>
          <span className="font-semibold text-gray-800">{formatRupiah(payment.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Metode</span>
          <span className="font-semibold text-gray-800 capitalize">{payment.method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Petugas</span>
          <span className="font-semibold text-gray-800">{payment.officerName || '-'}</span>
        </div>
        {/* Sisa Hutang Setelah Pembayaran */}
        {typeof payment.newDebt !== 'undefined' && (
          <div className="flex justify-between text-base pt-2 border-t border-dashed">
            <span className="text-gray-600 font-bold">Sisa Hutang Setelah Bayar</span>
            <span className="font-bold text-red-600">{formatRupiah(payment.newDebt)}</span>
          </div>
        )}
      </div>
      {/* Kondisi Keuangan */}
      {/* Tombol Aksi */}
      <div className="grid grid-cols-3 gap-3 print-hidden">
        <button onClick={handlePrint} disabled={isFetchingUrl || !receiptUrl} className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed flex flex-col items-center justify-center gap-1.5 text-gray-700 transition-all">
          {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}<span className="text-xs font-semibold">Cetak</span>
        </button>
        <button onClick={handleDownload} disabled={isFetchingUrl || !receiptUrl} className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed flex flex-col items-center justify-center gap-1.5 text-gray-700 transition-all">
          {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}<span className="text-xs font-semibold">Unduh</span>
        </button>
        <button onClick={handleShareWhatsApp} disabled={isFetchingUrl || !receiptUrl || !customer.phone} className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed flex flex-col items-center justify-center gap-1.5 text-green-600 disabled:opacity-50">
          {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <MessageCircle size={18}/>}<span className="text-xs font-semibold">Kirim WA</span>
        </button>
      </div>
      <div className="pt-4 space-y-3">
        <button onClick={onFinish} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold shadow-neumorph hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
          Selesai <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}