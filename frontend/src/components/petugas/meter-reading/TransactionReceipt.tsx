'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CheckCircle, Printer, Download, User, Banknote, Wallet, ArrowRight, UserCheck, MessageCircle, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { getCustomerHistoryForPdf, type CustomerHistoryData } from '@/services/customerHistoryService';
import { generateCustomerHistoryPdf } from '@/utils/customerHistoryPdfGenerator';
import { uploadPdfToCloudinary } from '@/utils/directUploader';
import { useDocument } from '@/hooks/petugas/useDocument';

// Tipe lokal agar reusable
export interface CustomerData {
  id: string;
  name: string;
  address: string;
  saldo: number;
  hutang: number;
  phoneNumber?: string;
}

export interface MeterReadingData {
  customerId: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  billAmount: number;
  readingDate: string;
  photos?: string[];
  billId: string;
}

export interface Payment {
  paymentId?: string;
  amount: number;
  method: 'cash' | 'transfer' | 'qris' | 'balance' | 'mixed';
  timestamp: string;
  status: 'pending' | 'completed';
  proofImage?: string;
  paymentType?: 'bill' | 'debt';
  newBalance?: number;
  newDebt?: number;
  officerName?: string;
  balanceUsed?: number;
  excessAmount?: number;
  totalPaymentPower?: number;
}

// ✅ TAMBAHKAN IMPORT UNTUK RIWAYAT

interface TransactionReceiptProps {
  customer: CustomerData;
  meterReading: MeterReadingData;
  payment: Payment;
  onNext: () => void;
}

export default function TransactionReceipt({ customer, meterReading, payment, onNext }: TransactionReceiptProps) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const toast = useToast();
  const { isLoading: isFetchingUrl, fetchDocumentUrl } = useDocument();

  // ✅ TAMBAHKAN STATE UNTUK RIWAYAT
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(true); // ✅ TOGGLE STATE
  const [historyError, setHistoryError] = useState<string | null>(null); // <-- Tambahkan state error

  // Tambahkan state untuk menandai sudah pernah mencoba fetch
  const [hasTriedFetch, setHasTriedFetch] = useState(false);

  const getPaymentDetails = () => {
    const totalPaid = payment.amount + (payment.balanceUsed || 0);
    const billAmount = meterReading.billAmount;
    const excess = Math.max(0, totalPaid - billAmount);
    return { totalPaid, excess };
  };

  const details = getPaymentDetails();

  // ✅ TAMBAHKAN FUNGSI UNTUK AMBIL RIWAYAT
  const loadCustomerHistory = useCallback(async () => {
    if (!customer) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    setHasTriedFetch(true);
    try {
      const historyData = await getCustomerHistoryForPdf(customer.id);
      setCustomerHistory(historyData);
    } catch {
      setHistoryError('Gagal memuat riwayat pelanggan');
      toast.showToast('error', 'Gagal memuat riwayat pelanggan'); 
    } finally {
      setIsLoadingHistory(false);
    }
  }, [customer, toast]);

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
      toast.showToast('error', 'URL Struk tidak tersedia. Coba lagi.'); 
    }
  };

  // Helper to trigger press animation
  const triggerPress = (_btn: 'print' | 'download' | 'wa', cb: () => void) => {
    // Animation handled by CSS :active, so just call cb directly
    cb();
  };

  const handlePrint = () => {
    triggerPress('print', openReceiptUrl);
  };

  const handleDownload = () => {
    triggerPress('download', openReceiptUrl);
  };

  // ✅ UPDATE handleShareWhatsApp
  const handleShareWhatsApp = async () => {
    triggerPress('wa', async () => {
      const customerPhone = customer.phoneNumber;
      if (!customerPhone) {
        toast.showToast('error', 'Nomor WhatsApp pelanggan tidak valid.');
        return;
      }
      if (!receiptUrl) {
        toast.showToast('error', 'Harap tunggu hingga URL struk selesai dimuat.');
        return;
      }
      let historyUrl = '';
      if (includeHistory && customerHistory) {
        const historyBlob = generateCustomerHistoryPdf(customer, customerHistory, 'blob') as Blob;
        const historyFileName = `riwayat-${customer.id}-${Date.now()}.pdf`;
        historyUrl = await uploadPdfToCloudinary(historyBlob, historyFileName, 'reports');
      }
      let message = `Yth. Bpk/Ibu ${customer.name},\n\nTerima kasih atas pembayaran tagihan air Anda.\n\nBukti Pembayaran:\n${receiptUrl}`;
      if (historyUrl) {
        message += `\n\nRiwayat Lengkap Pelanggan:\n${historyUrl}`;
      }
      message += `\n\nSalam,\nTirta Muna`;
      const encodedMessage = encodeURIComponent(message);
      const formattedPhone = customerPhone.replace(/^0/, '62');
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast.showToast('success', 'Dokumen berhasil disiapkan.');
    });
  };

  // ✅ TAMBAHKAN useEffect UNTUK LOAD RIWAYAT
  useEffect(() => {
    // Hanya fetch jika belum pernah mencoba atau belum error
    if (!hasTriedFetch && !historyError) {
      loadCustomerHistory();
    }
  }, [customer, loadCustomerHistory, hasTriedFetch, historyError]);

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Main Receipt Container */}
      <div className="printable-area bg-[#e0e5ec] p-5 sm:p-6 rounded-2xl shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] space-y-6">
        {/* Header */}
        <div className="text-center pb-5 border-b-2 border-dashed border-gray-300/70">
          <div className="inline-block p-3 bg-green-100 rounded-full shadow-neumorph mb-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Pembayaran Berhasil</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(payment.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {/* Details Section */}
        <div className="space-y-5">
          {/* Customer & Transaction Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><User size={16}/> Info Pelanggan & Transaksi</h3>
            <div className="text-sm space-y-2.5 p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
              <div className="flex justify-between items-start"><span className="text-gray-500 w-2/5">Nama</span><span className="font-medium text-gray-800 text-right w-3/5">{customer.name}</span></div>
              <div className="flex justify-between items-start"><span className="text-gray-500 w-2/5">ID Pelanggan</span><span className="font-medium text-gray-800 text-right w-3/5">{customer.id}</span></div>
              <div className="flex justify-between items-start"><span className="text-gray-500 w-2/5">Alamat</span><span className="font-medium text-gray-800 text-right w-3/5">{customer.address}</span></div>
              <div className="flex justify-between items-start pt-2 mt-2 border-t border-gray-300/50">
                <span className="text-gray-500 w-2/5 flex items-center gap-1"><UserCheck size={14} />Petugas</span>
                <span className="font-semibold text-blue-600 text-right w-3/5">{payment.officerName || 'N/A'}</span>
              </div>
            </div>
          </div>
          {/* Payment Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><Banknote size={16}/> Rincian Pembayaran</h3>
            <div className="text-sm space-y-2 p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
              <div className="flex justify-between"><span className="text-gray-500">Tagihan Bulan Ini</span><span className="font-medium text-gray-800">{formatRupiah(meterReading.billAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tunai / Transfer</span><span className="font-medium text-gray-800">{formatRupiah(payment.amount)}</span></div>
              {payment.balanceUsed && payment.balanceUsed > 0 && (
                <div className="flex justify-between"><span className="text-blue-500 font-medium">Saldo Digunakan</span><span className="font-semibold text-blue-600">- {formatRupiah(payment.balanceUsed)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-2.5 mt-2 border-t border-gray-300/70">
                <span className="text-gray-500">Total Dibayar</span>
                <span className="text-gray-900">{formatRupiah(details.totalPaid)}</span>
              </div>
            </div>
          </div>
          {/* Financial Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><Wallet size={16}/> Kondisi Keuangan</h3>
            <div className="text-sm space-y-2 p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
              {details.excess > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Kelebihan (Saldo Baru)</span>
                  <span className="font-bold">{formatRupiah(details.excess)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Sisa Saldo</span><span className="font-medium text-gray-800">{formatRupiah(payment.newBalance ?? customer.saldo ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sisa Hutang</span><span className="font-medium text-red-600">{formatRupiah(payment.newDebt ?? customer.hutang ?? 0)}</span></div>
            </div>
          </div>
          {/* Payment Proof */}
          {payment.proofImage && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm">Bukti Pembayaran</h3>
              <div className="p-2 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] flex justify-center">
              <Image
              src={payment.proofImage}
              alt="Bukti Pembayaran"
              width={150}
              height={200}
              className="rounded-md object-contain"
              style={{ height: 'auto', width: 'auto' }} // <-- Tambahkan style agar rasio aspek otomatis
            />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ TAMBAHKAN TOGGLE UNTUK RIWAYAT */}
      <div className="pt-4 space-y-3 print-hidden">
        {/* Toggle untuk riwayat */}
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-neumorph">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeHistory"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              disabled={isLoadingHistory || !!historyError}
            />
            <label htmlFor="includeHistory" className="text-sm text-gray-700 font-medium">
              Sertakan riwayat lengkap pelanggan
            </label>
            {isLoadingHistory && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Riwayat berisi data tagihan, pemakaian, dan pembayaran 6 bulan terakhir
          </p>
          {historyError && (
            <p className="text-xs text-red-500 mt-1 ml-7">{historyError}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            disabled={isFetchingUrl || !receiptUrl}
            className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed animate-btn-press flex flex-col items-center justify-center gap-1.5 text-gray-700 transition-all"
          >
            {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}<span className="text-xs font-semibold">Cetak</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isFetchingUrl || !receiptUrl}
            className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed animate-btn-press flex flex-col items-center justify-center gap-1.5 text-gray-700 transition-all"
          >
            {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}<span className="text-xs font-semibold">Unduh</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            disabled={isFetchingUrl || !receiptUrl || (includeHistory && (isLoadingHistory || !!historyError || !customerHistory)) || !customer.phoneNumber}
            className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed animate-btn-press flex flex-col items-center justify-center gap-1.5 text-green-600 disabled:opacity-50 transition-all"
          >
            {isFetchingUrl ? <Loader2 className="animate-spin" size={18}/> : <MessageCircle size={18}/>}<span className="text-xs font-semibold">Kirim WA</span>
          </button>
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-base"
        >
          <span>Selesai</span> <ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
}

// Tailwind animation for button press
// Add to your global CSS (e.g. styles/globals.css):
// .animate-btn-press { animation: btnPress 0.15s linear; }
// @keyframes btnPress { 0% { transform: scale(1); } 50% { transform: scale(0.93); } 100% { transform: scale(1); } }