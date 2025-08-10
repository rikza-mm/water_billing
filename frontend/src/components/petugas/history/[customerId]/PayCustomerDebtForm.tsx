'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDebtPaymentDashboard, type PayDebtRequest } from '@/hooks/petugas/history/useDebtPaymentDashboard';
import { ShieldAlert, Loader, Copy, Check, QrCode, X, Upload } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { uploadImageToCloudinary, uploadPdfToCloudinary } from '@/utils/directUploader';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { generateDebtPaymentReceiptPdf, DebtPaymentData } from '@/utils/debtPaymentReceiptPdfGenerator';
import { saveDocumentUrl } from '@/services/documentService';
import { useSettings } from '@/hooks/admin/settings/useSettings';
import Image from 'next/image';
import he from 'he';
import { Modal } from '@/components/common/Modal';

type PayCustomerDebtFormProps = {
  customerId: string | number;
  hutang: number;
  customerData: { name: string; address: string; saldo?: number; hutang?: number };
  onSuccess?: (paymentData: DebtPaymentData) => void;
  onClose: () => void;
};

export default function PayCustomerDebtForm({ customerId, hutang, customerData, onSuccess, onClose }: PayCustomerDebtFormProps) {
  const [amount, setAmount] = useState(hutang);
  const [method, setMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);

  const { payDebt, loading: isApiProcessing } = useDebtPaymentDashboard();
  const { settings, fetchSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const paymentInfo = useMemo(() => {
    const paymentAmount = Number(amount) || 0;
    const remainingDebt = hutang - paymentAmount;
    return {
      remainingDebt: remainingDebt > 0 ? remainingDebt : 0,
      isOverpaying: paymentAmount > hutang,
    };
  }, [amount, hutang]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmount(Number(raw) || 0);
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(text);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch {}
  };

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isApiProcessing) return;
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const toastId = toast.loading('Mengompres & mengunggah bukti...');
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const url = await uploadImageToCloudinary(compressedFile, 'payment_proofs');
      setUploadedProofUrl(url);
      setProofPreview(url);
      toast.success('Bukti pembayaran berhasil diunggah!', { id: toastId });
    } catch {
      toast.error('Gagal memproses gambar.', { id: toastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (isApiProcessing) return;
    e.preventDefault();
    const parsedCustomerId = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
    if (!parsedCustomerId || isNaN(parsedCustomerId)) {
      toast.error('ID pelanggan tidak valid');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }
    if (!method) {
      toast.error('Metode pembayaran wajib dipilih');
      return;
    }
    const uploadedImageUrl: string | undefined = uploadedProofUrl || undefined;
    
    if ((method === 'transfer' || method === 'qris') && !uploadedImageUrl) {
      toast.error('Bukti pembayaran wajib dilampirkan.');
      return;
    }
    
    try {
      toast.loading('Memproses pembayaran...');
      const payload: PayDebtRequest = {
        customer_id: parsedCustomerId,
        amount,
        method,
        proofUrl: uploadedImageUrl,
      };
      const res = await payDebt(payload);
      toast.dismiss();
      if (res.success) {
        toast.success(res.message || 'Pembayaran hutang berhasil');
        const responseData = res.data as {
          paymentId?: string;
          newBalance?: number;
          newDebt?: number;
          officerName?: string;
        };
        const finalPaymentData: DebtPaymentData = {
          paymentId: responseData?.paymentId,
          amount,
          method,
          timestamp: new Date().toISOString(),
          status: 'completed',
          proofImage: uploadedImageUrl,
          paymentType: 'debt',
          newBalance: responseData?.newBalance,
          newDebt: responseData?.newDebt,
          officerName: responseData?.officerName,
        };
        try {
          toast.loading('Mengarsipkan struk...');
          const receiptBlob = generateDebtPaymentReceiptPdf(
            {
              id: String(customerId),
              name: customerData.name,
              address: customerData.address,
              saldo: finalPaymentData.newBalance ?? customerData.saldo ?? 0,
              hutang: finalPaymentData.newDebt ?? customerData.hutang ?? 0,
            },
            finalPaymentData,
            'blob'
          ) as Blob;
          if (!receiptBlob) throw new Error("Gagal membuat PDF struk hutang.");
          const receiptFileName = `struk-hutang-${finalPaymentData.paymentId}.pdf`;
          const receiptUrl = await uploadPdfToCloudinary(receiptBlob, receiptFileName, 'receipts');
          if (finalPaymentData.paymentId) {
            await saveDocumentUrl(String(finalPaymentData.paymentId), 'receipt', receiptUrl);
            toast.dismiss();
            toast.success('Struk hutang berhasil diarsipkan.');
          }
        } catch {
          toast.dismiss();
          toast.error("Pembayaran berhasil, namun struk gagal diarsipkan.");
        }
        if (onSuccess) {
          onSuccess(finalPaymentData);
        }
      } else {
        throw new Error(res.message || 'Pembayaran gagal.');
      }
    } catch (error) {
      toast.dismiss();
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      // setLoading(false); // Selesai loading
    }
  };

  const isFormInvalid = useMemo(() => {
    if (amount <= 0 || amount > hutang) return true;
    if ((method === 'transfer' || method === 'qris') && !uploadedProofUrl) return true;
    return false;
  }, [amount, hutang, method, uploadedProofUrl]);

  // Langkah 4: Header, Main, Footer
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200/80 flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">Pembayaran Hutang</h2>
        </div>
      </header>
      {/* ✅ MODAL QRIS */}
      <Modal 
        isOpen={isQrisModalOpen} 
        onClose={() => setIsQrisModalOpen(false)} 
        title="Pindai Kode QRIS untuk Pembayaran"
      >
        <div className="p-4 flex flex-col items-center">
          {settings.qris_image_url && (
            <Image 
              src={he.decode(settings.qris_image_url)} 
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
      <main className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* 1. Informasi Total Tunggakan (Tetap di Atas) */}
        <div className="p-4 bg-red-100/50 rounded-lg text-center shadow-neumorph-inset">
          <p className="text-sm text-red-800 font-medium">Total Tunggakan</p>
          <p className="text-3xl font-bold text-red-600 tracking-tight">{formatRupiah(hutang)}</p>
        </div>
        {/* 2. Input Jumlah Bayar */}
        <div>
          <label htmlFor="debt-amount" className="text-sm font-medium text-gray-600 mb-1 block">Jumlah Bayar</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
            <input id="debt-amount" type="text" inputMode="numeric" value={formatRupiah(amount || 0)} onChange={handleAmountChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#e0e5ec] shadow-neumorph-inset text-2xl font-bold text-gray-800 focus:outline-none" />
          </div>
        </div>
        {/* 3. Peringatan Sisa Tunggakan (Tetap Sama) */}
        {amount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 shadow-neumorph-inset text-yellow-900 my-2">
            <ShieldAlert size={18} className="flex-shrink-0 text-yellow-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {paymentInfo.remainingDebt > 0
                  ? <>Sisa tunggakan setelah pembayaran: <span className="font-bold text-yellow-800">{formatRupiah(paymentInfo.remainingDebt)}</span></>
                  : <>Tunggakan akan <span className="font-bold text-green-700">lunas</span> setelah pembayaran ini.</>
                }
              </span>
            </div>
          </div>
        )}
        {/* 4. Pilihan Metode Pembayaran */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">Metode Pembayaran</label>
          <div className="grid grid-cols-3 gap-3">
            {(['cash', 'transfer', 'qris'] as const).map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)} className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${method === m ? 'bg-blue-600 text-white shadow-neumorph-pressed' : 'bg-[#e0e5ec] text-gray-700 shadow-neumorph'}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* 5. Bagian Dinamis (Info Bank/QRIS & Upload Bukti) */}
        <AnimatePresence>
          {(method === 'transfer' || method === 'qris') && (
            <motion.div
              key="payment-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden pt-4 border-t border-gray-300/50"
            >
              {/* Tampilan Rekening & QRIS */}
              {method === 'transfer' && settings.bank_account_bca && (
                <div className="p-3 bg-white/60 rounded-xl shadow-neumorph-inset">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">BCA</h4>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800">{settings.bank_account_bca}</p>
                    <button type="button" onClick={() => handleCopyToClipboard(settings.bank_account_bca!)} className="text-xs bg-[#e0e5ec] text-blue-600 font-semibold px-3 py-1.5 rounded-lg shadow-neumorph hover:shadow-neumorph-pressed">
                      {copiedAccount === settings.bank_account_bca ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
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
                </div>
              )}
              {/* Input Upload Bukti */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <Upload size={16}/> Unggah Bukti (Wajib)
                </label>
                {proofPreview ? (
                  <div className="relative group w-fit">
                    <Image 
                      src={proofPreview} 
                      alt="Pratinjau" 
                      width={0}
                      height={0}
                      className="h-40 w-auto rounded-lg shadow-md" // kedua dimensi diatur bersamaan
                      sizes="160px"
                    />
                    <button 
                      type="button" 
                      onClick={() => { setProofPreview(null); setUploadedProofUrl(null); }} 
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
                    disabled={isApiProcessing}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="p-4 border-t border-gray-200/80 flex-shrink-0 space-y-3">
        <button
          type="submit"
          disabled={isApiProcessing || isFormInvalid}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-neumorph disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isApiProcessing ? (
            <><Loader className="animate-spin" size={20} /> Memproses...</>
          ) : (
            'Konfirmasi Pembayaran'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isApiProcessing}
          className="w-full py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-semibold shadow-neumorph hover:shadow-neumorph-pressed disabled:opacity-60 transition-all text-sm"
        >
          Kembali
        </button>
      </footer>
    </form>
  );
}