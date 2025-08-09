'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Wallet, ShieldCheck, ShieldAlert, BadgeInfo, Loader, AlertTriangle, Upload, X, Copy, Check, QrCode, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/utils/formatters';
import he from 'he';

import { uploadImageToCloudinary, uploadPdfToCloudinary } from '@/utils/directUploader'; 
import toast from 'react-hot-toast';
import { usePayment } from '@/hooks/petugas/meter-reading/usePayment';
import imageCompression from 'browser-image-compression';
import { useSettings } from '@/hooks/admin/settings/useSettings';

import { generateReceiptPdf } from '@/utils/receiptGenerator';
import { saveDocumentUrl } from '@/services/documentService';
import type { MeterReading } from '@/app/petugas/meter-reading/page';
import { Modal } from '@/components/common/Modal';

// Tipe CustomerData dan Bill dibuat lokal agar reusable
export interface CustomerData {
  id: string;
  name: string;
  address: string;
  saldo: number;
  hutang: number;
  meterNumber?: string;
  category_name?: string;
  phoneNumber?: string;
}

export interface Bill {
  bill_id: string;
  amount: number;
  status: string;
  total_due: number;
  dueDate: string;
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

interface PaymentFormProps {
  bill: Bill;
  customer: CustomerData;
  meterReading: MeterReading; // ✅ DEFINISIKAN TIPE UNTUK PROPS BARU
  onSuccess: (data: Payment) => void;
  onPayLater: () => void;
  onCancel: () => void;
}

// --- Helper untuk format input Rupiah ---
const formatRupiahInput = (value: string) => {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID').format(Number(value.replace(/[^0-9]/g, '')));
};
const parseRupiahInput = (value: string) => {
  return value.replace(/[^0-9]/g, '');
};


export default function PaymentForm({
  bill,
  customer,
  meterReading,
  onSuccess,
  onPayLater,
  onCancel,
}: PaymentFormProps) {
  const { processPayment, loading, setLoading } = usePayment();
  const [amount, setAmount] = useState<string>(Math.round(bill.total_due ?? bill.amount).toString());
  const [method, setMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [useBalance, setUseBalance] = useState(false);
  const [error, setError] = useState('');

  // ✅ State baru untuk file bukti pembayaran
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  
  // ✅ State untuk feedback copy to clipboard
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // 1. State untuk proses arsip struk
  const [isArchiving, setIsArchiving] = useState(false); 
  // 2. State modal QRIS
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false); 

  const { settings, fetchSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    // FIX: Sinkronkan state `amount` dengan prop `bill` yang baru.
    // Ini memastikan form direset dengan benar untuk setiap transaksi baru.
    if (bill) {
      setAmount(Math.round(bill.total_due ?? bill.amount).toString());
    }
  }, [bill, bill.bill_id]); // Dijalankan setiap kali ID tagihan berubah.

  const totalDue = bill.total_due ?? bill.amount;

  // Kalkulasi dinamis ringkasan pembayaran
  const parsedAmount = parseFloat(parseRupiahInput(amount) || '0');
  const paymentSummary = useMemo(() => {
    const customerSaldo = customer.saldo || 0;
    let balanceToUse = 0;
    if (useBalance && customerSaldo > 0) {
      const neededAfterCash = totalDue - parsedAmount;
      balanceToUse = Math.min(customerSaldo, neededAfterCash > 0 ? neededAfterCash : 0);
    }
    const totalPayment = parsedAmount + balanceToUse;
    const excess = totalPayment - totalDue;
    return {
      balanceUsed: balanceToUse,
      totalPayment: totalPayment,
      kekurangan: Math.max(0, totalDue - totalPayment),
      kelebihan: Math.max(0, excess),
    };
  }, [parsedAmount, useBalance, customer.saldo, totalDue]);

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const options = {
      maxSizeMB: 0.5, // 500 KB
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.7,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      setProofImage(compressedFile);
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofPreview(URL.createObjectURL(compressedFile));
    } catch {
      setError('Gagal memproses gambar bukti pembayaran');
    }
  };

  // ✅ Fungsi untuk menyalin nomor rekening
  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(text);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch { /* fallback handled if needed */ }
  };

  // ✅ Fungsi untuk kirim tagihan ke WhatsApp
const handleSendWhatsApp = () => {
    if (!customer.phoneNumber) {
        toast.error("Nomor telepon pelanggan tidak tersedia.");
        return;
    }

    const formattedPhone = customer.phoneNumber.replace(/^0/, '62');
    
    // --- Logika Periode (Tetap Sama) ---
    const now = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const period = bill && bill.dueDate
      ? `${monthNames[new Date(bill.dueDate).getMonth()]} ${new Date(bill.dueDate).getFullYear()}`
      : `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // --- ✅ LOGIKA PESAN DINAMIS BARU ---
    let paymentInstructions = '';
    
    // Ambil URL QRIS yang sudah bersih
    const qrisUrl = settings.qris_image_url ? he.decode(settings.qris_image_url) : null;

    if (method === 'qris' && qrisUrl) {
        // Jika metode adalah QRIS dan URL-nya ada
        paymentInstructions = 
            `Pembayaran dapat dilakukan dengan memindai Kode QRIS berikut:\n` +
            `${qrisUrl}\n\n` +
            `Silakan unggah bukti pembayaran setelah transaksi berhasil.`;
    } else {
        // Fallback ke Transfer Bank jika QRIS tidak dipilih atau tidak ada
        const rekeningBCA = settings.bank_account_bca || 'Nomor rekening belum diatur.';
        paymentInstructions = 
            `Pembayaran dapat dilakukan melalui transfer ke rekening berikut:\n` +
            `BCA: ${rekeningBCA}`;
    }

    // --- Template Pesan Utama (Tetap Sama) ---
    const message =
      `PEMBERITAHUAN TAGIHAN AIR\n\n` +
      `Yth. Bpk/Ibu ${customer.name},\n\n` +
      `Berikut adalah rincian tagihan air Anda untuk periode ${period}:\n\n` +
      `ID Pelanggan: ${customer.id}\n` +
      `Jumlah Tagihan: ${formatRupiah(totalDue)}\n\n` +
      `${paymentInstructions}\n\n` + // <-- Menggunakan instruksi pembayaran dinamis
      `Terima kasih atas perhatian Anda.\n\n` +
      `Hormat kami,\nTirta Muna`;

    // --- Pengiriman Pesan (Tetap Sama) ---
    const encodedMessage = encodeURIComponent(message.replace(/\\n/g, '\n'));
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
};

const handleSubmit = async () => {
  setError('');
  if ((method === 'transfer' || method === 'qris') && !proofImage) {
    return setError("Bukti pembayaran wajib dilampirkan.");
  }
  let uploadedImageUrl: string | undefined;
  try {
    setLoading(true);
    // LANGKAH 1: Unggah bukti pembayaran jika ada
    if (proofImage) {
      uploadedImageUrl = await uploadImageToCloudinary(proofImage, 'payment_proofs');
    }
    // LANGKAH 2: Proses pembayaran ke backend
    toast.loading('Memproses pembayaran...');
    const paymentPayload = {
      bill_id: bill.bill_id,
      amount: parsedAmount.toString(),
      method: method,
      use_balance: useBalance,
      proofUrl: uploadedImageUrl
    };
    const result = await processPayment(paymentPayload);
    toast.dismiss();
    // LANGKAH 3: Cek jika pembayaran dari backend SUKSES
    if (result.success && result.data) {
      toast.success(result.message || 'Pembayaran berhasil!');

      // ✅ LANGKAH 4: Buat objek pembayaran LENGKAP untuk digunakan di sisa alur
      const finalPaymentData: Payment = {
        ...(result.data as object),
        amount: parsedAmount, // jumlah tunai/transfer
        method: method,
        proofImage: uploadedImageUrl,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceUsed: paymentSummary.balanceUsed,
        excessAmount: paymentSummary.kelebihan,
        totalPaymentPower: paymentSummary.totalPayment,
      };

      // =============== ARSIP STRUK OTOMATIS ===============
      try {
        setIsArchiving(true);
        // ✅ LANGSUNG GUNAKAN DATA DARI PROPS
        const receiptBlob = generateReceiptPdf(
          customer,
          meterReading, // <-- Gunakan objek `meterReading` asli yang akurat
          finalPaymentData,
          'blob'
        ) as Blob;

        if (!receiptBlob) throw new Error("Gagal membuat file PDF struk.");

        // 5b. Unggah 'Blob' ke Cloudinary (folder 'receipts')
        const receiptFileName = `struk-${customer.id}-${bill.bill_id}-${Date.now()}.pdf`;
        const receiptUrl = await uploadPdfToCloudinary(receiptBlob, receiptFileName, 'receipts');
        
        // 5c. Panggil documentService untuk menyimpan URL ke database
        if (finalPaymentData.paymentId) {
          await saveDocumentUrl(String(finalPaymentData.paymentId), 'receipt', receiptUrl);
          toast.success('Struk berhasil diarsipkan.');
        }

      } catch {
        // Notifikasi ini tidak menghentikan alur, hanya memberi info
        toast.error("Pembayaran berhasil, namun struk gagal diarsipkan.");
      } finally {
        setIsArchiving(false);
      }

      // LANGKAH 6: Lanjutkan alur ke halaman struk dengan data yang SUDAH LENGKAP
      onSuccess(finalPaymentData);

    } else {
      // Jika pembayaran gagal di backend, lempar error
      throw new Error(result.message || 'Pembayaran gagal dari server.');
    }
  } catch (error) {
    // Menangkap semua error lain yang mungkin terjadi
    toast.dismiss();
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.';
    setError(message);
  } finally {
    setLoading(false);
    setIsArchiving(false);
  }
};

  useEffect(() => {
    // Cleanup function untuk revokeObjectURL saat komponen unmount atau proofPreview berubah
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, [proofPreview]);

  return (
    <div className="space-y-6">
      {/* Modal QRIS Besar */}
      <Modal 
        isOpen={isQrisModalOpen} 
        onClose={() => setIsQrisModalOpen(false)} 
        title="Pindai Kode QRIS untuk Pembayaran"
      >
        <div className="p-4 flex flex-col items-center">
          {settings.qris_image_url && (
            <Image 
              src={settings.qris_image_url} 
              alt="QRIS Code Pembayaran" 
              width={350} 
              height={350} 
              className="rounded-lg shadow-md"
              style={{ height: 'auto', width: 'auto' }}
            />
          )}
          <p className="mt-4 text-sm text-gray-600 text-center">
            Silakan pindai kode QR di atas menggunakan aplikasi perbankan atau e-wallet Anda.
          </p>
          <button
            onClick={() => setIsQrisModalOpen(false)}
            className="mt-6 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-neumorph hover:bg-blue-700"
          >
            Tutup
          </button>
        </div>
      </Modal>

        {/* Main Payment Container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] space-y-5">
            {/* Customer Info Header */}
            <div className="flex items-center gap-4">
                <div className="bg-[#e0e5ec] p-3 rounded-full shadow-neumorph flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-base leading-tight">{customer.name}</h3>
                    <p className="text-sm text-gray-500">ID Pelanggan: {customer.id}</p>
                </div>
            </div>

            {/* Total Bill Info */}
            <div className="text-center p-4 bg-white/60 rounded-xl shadow-neumorph-inset">
                <p className="text-sm font-medium text-gray-600">Total Tagihan Bulan Ini</p>
                <p className="text-4xl font-extrabold text-blue-600 tracking-tight">{formatRupiah(totalDue)}</p>
            </div>

            {/* Payment Method & Amount */}
            <div className="pt-5 border-t border-gray-300/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-2">Metode Pembayaran</label>
                        <select
                          id="method" value={method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as 'cash' | 'transfer' | 'qris')}
                          className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          disabled={loading}
                        >
                            <option value="cash">Tunai</option>
                            <option value="transfer">Transfer Bank</option>
                            <option value="qris">QRIS</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-2">Jumlah Bayar</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
                            <input
                                type="text"
                                value={formatRupiahInput(amount)}
                                onChange={(e) => setAmount(parseRupiahInput(e.target.value))}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="0" disabled={loading}
          />
        </div>
      </div>
                </div>
            </div>

            {/* Use Balance Toggle */}
            {customer.saldo && customer.saldo > 0 && (
                <div className="pt-5 border-t border-gray-300/50">
                    <label htmlFor="useBalance" className="p-4 rounded-xl bg-[#e0e5ec] shadow-neumorph cursor-pointer flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-green-600" />
                            <div>
                                <span className="font-semibold text-gray-700">Gunakan Saldo</span>
                                <p className="text-xs text-gray-500">Tersedia: {formatRupiah(customer.saldo)}</p>
                            </div>
                        </div>
                        <input
                            id="useBalance" type="checkbox" checked={useBalance} onChange={(e) => setUseBalance(e.target.checked)}
                            className="h-5 w-5 rounded-md text-blue-600 focus:ring-blue-500 border-gray-300 shadow-sm"
                        />
                    </label>
                </div>
            )}

            {/* Conditional Payment Info & Proof */}
            {(method === 'transfer' || method === 'qris') && (
                <div className="pt-5 border-t border-gray-300/50 space-y-4">
                    {method === 'transfer' && (
                        <>
                            {settings.bank_account_bca && (
                                <div className="p-3 bg-white/60 rounded-xl shadow-neumorph-inset">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">BCA</h4>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{settings.bank_account_bca}</p>
                                        </div>
                                        <button onClick={() => handleCopyToClipboard(settings.bank_account_bca!)} className="text-xs bg-[#e0e5ec] text-blue-600 font-semibold px-3 py-1.5 rounded-lg shadow-neumorph hover:shadow-neumorph-pressed">
                                            {copiedAccount === settings.bank_account_bca ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {method === 'qris' && settings.qris_image_url && (
                        <div className="p-3 bg-white/60 rounded-xl shadow-neumorph-inset text-center">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2"><QrCode size={16} /> Pindai Kode QRIS</h4>
                            <Image 
                              src={he.decode(settings.qris_image_url)} 
                              alt="QRIS Code" 
                              width={150} 
                              height={150} 
                              className="mx-auto rounded-lg cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setIsQrisModalOpen(true)}
                              style={{ height: 'auto', width: 'auto' }}
                            />
            <p 
              className="text-xs text-blue-600 mt-2 cursor-pointer"
              onClick={() => setIsQrisModalOpen(true)}
            >
              Klik untuk perbesar
            </p>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5"><Upload size={16}/> Unggah Bukti</label>
                         {proofPreview ? (
                            <div className="relative group w-fit">
                              <Image
                                src={proofPreview}
                                alt="Pratinjau"
                                width={160}
                                height={160}
                                className="rounded-lg shadow-md"
                                style={{ width: '160px', height: '160px' }}
                              />
                              <button 
                                onClick={() => setProofPreview(null)} 
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                              >
                                <X size={16}/>
                              </button>
                            </div>
                        ) : (
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleProofChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        )}
          </div>
        </div>
      )}
        </div>

        {/* Payment Summary & Alerts */}
        <div className="space-y-3">
            {paymentSummary.balanceUsed > 0 && (
                <div className="p-4 rounded-xl bg-blue-50 shadow-neumorph-inset text-blue-800">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full shadow-neumorph"><BadgeInfo size={20} className="text-blue-600" /></div>
                        <div><h4 className="font-bold">Saldo Digunakan</h4><p className="text-sm">Sebesar <strong className="text-lg">{formatRupiah(paymentSummary.balanceUsed)}</strong> dari saldo pelanggan akan digunakan.</p></div>
                </div>
                </div>
            )}
            {paymentSummary.kekurangan > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 shadow-neumorph-inset text-orange-800">
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-orange-100 p-2 rounded-full shadow-neumorph"><ShieldAlert size={20} className="text-orange-600" /></div>
                        <div><h4 className="font-bold">Ada Kekurangan Bayar</h4><p className="text-sm">Kekurangan sebesar <strong className="text-lg">{formatRupiah(paymentSummary.kekurangan)}</strong> akan menjadi hutang.</p></div>
                    </div>
              </div>
            )}
            {paymentSummary.kelebihan > 0 && (
                <div className="p-4 rounded-xl bg-green-50 shadow-neumorph-inset text-green-800">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-green-100 p-2 rounded-full shadow-neumorph"><ShieldCheck size={20} className="text-green-600" /></div>
                        <div><h4 className="font-bold">Ada Kelebihan Bayar</h4><p className="text-sm">Kelebihan sebesar <strong className="text-lg">{formatRupiah(paymentSummary.kelebihan)}</strong> akan jadi saldo.</p></div>
                    </div>
              </div>
            )}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 shadow-neumorph-inset text-red-800">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-red-100 p-2 rounded-full shadow-neumorph"><AlertTriangle size={20} className="text-red-600" /></div>
                        <div><h4 className="font-bold">Terjadi Kesalahan</h4><p className="text-sm">{error}</p></div>
              </div>
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
            <button
                onClick={handleSubmit}
                disabled={loading || isArchiving}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:bg-blue-400 disabled:shadow-neumorph-inset transition-all flex items-center justify-center gap-2 text-base"
            >
                {(loading || isArchiving) && <Loader className="animate-spin" size={20} />}
                <span>
                  {loading && !isArchiving ? 'Memproses Pembayaran...' : 
                   isArchiving ? 'Mengarsipkan Struk...' : 
                   'Proses Pembayaran'}
                </span>
            </button>
            {/* Tambahkan tombol Kirim Tagihan ke WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!customer.phoneNumber}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-bold shadow-neumorph transition-all hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              <MessageCircle size={20} />
              <span>Kirim Tagihan ke WhatsApp</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onPayLater}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-semibold shadow-neumorph hover:shadow-neumorph-pressed disabled:opacity-60 transition-all text-sm"
                >
                    Bayar Nanti
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-red-100 text-red-600 font-semibold shadow-neumorph hover:bg-red-200 disabled:opacity-60 transition-all text-sm"
                >
                    Batal & Catat Ulang
                </button>
          </div>
        </div>
    </div>
  );
}