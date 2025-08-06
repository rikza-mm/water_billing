'use client';

import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useDebtPaymentDashboard, type PayDebtRequest } from '@/hooks/petugas/history/useDebtPaymentDashboard';
import { ShieldAlert, Loader, ArrowLeft } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { uploadImageToCloudinary, uploadPdfToCloudinary } from '@/utils/directUploader';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { generateDebtPaymentReceiptPdf, DebtPaymentData } from '@/utils/debtPaymentReceiptPdfGenerator';
import { saveDocumentUrl } from '@/services/documentService';

type PayCustomerDebtFormProps = {
  customerId: string | number;
  hutang: number;
  customerData: { name: string; address: string; saldo?: number; hutang?: number };
  onSuccess?: (paymentData: DebtPaymentData) => void;
  onClose: () => void;
};

export default function PayCustomerDebtForm({ customerId, hutang, customerData, onSuccess }: PayCustomerDebtFormProps) {
  const { payDebt, loading: isApiProcessing } = useDebtPaymentDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState<'amount' | 'method'>('amount');
  const [amount, setAmount] = useState(hutang);
  const [method, setMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [proofImage, setProofImage] = useState<File | null>(null);
  //const [initialDebt] = useState(hutang);

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

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.7,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      setProofImage(compressedFile);
    } catch {
      toast.error('Gagal memproses gambar bukti pembayaran');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

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
    if ((method === 'transfer' || method === 'qris') && !proofImage) {
      toast.error('Bukti pembayaran wajib dilampirkan.');
      return;
    }

    let uploadedImageUrl: string | undefined = undefined;
    setIsSubmitting(true);
    try {
      // LANGKAH 1: Unggah bukti pembayaran
      if ((method === 'transfer' || method === 'qris') && proofImage) {
        toast.loading('1/2 Mengunggah bukti...');
        uploadedImageUrl = await uploadImageToCloudinary(proofImage, 'payment_proofs');
        toast.dismiss();
      }
      // LANGKAH 2: Proses pembayaran hutang ke backend
      toast.loading('2/2 Memproses pembayaran...');
      const payload: PayDebtRequest = {
        customer_id: parsedCustomerId,
        amount,
        method,
        proofUrl: uploadedImageUrl
      };
      const res = await payDebt(payload);
      toast.dismiss();
      // LANGKAH 3: Cek jika pembayaran dari backend SUKSES
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
        // ================================================================
        // ✅ LANGKAH 5: ARSIP STRUK OTOMATIS UNTUK PEMBAYARAN HUTANG
        // ================================================================
        // Arsip otomatis struk hutang
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
        // LANGKAH 6: Lanjutkan alur dengan memanggil onSuccess
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
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={modalStep}
          className="flex flex-col flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {modalStep === 'amount' ? (
            <>
              <main className="p-4 space-y-4 flex-1 overflow-y-auto">
                <div className="p-4 bg-red-100/50 rounded-lg text-center shadow-neumorph-inset">
                  <p className="text-sm text-red-800 font-medium">Total Tunggakan</p>
                  <p className="text-3xl font-bold text-red-600 tracking-tight">{formatRupiah(hutang)}</p>
                </div>
                <div>
                  <label htmlFor="debt-amount" className="text-sm font-medium text-gray-600 mb-1 block">Jumlah Bayar</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
                    <input id="debt-amount" type="text" inputMode="numeric" value={formatRupiah(amount || 0)} onChange={handleAmountChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#e0e5ec] shadow-neumorph-inset text-2xl font-bold text-gray-800 focus:outline-none" />
                  </div>
                </div>
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
              </main>
              <footer className="p-4 border-t border-gray-200/80 flex-shrink-0">
                <button type="button" onClick={() => setModalStep('method')} disabled={!amount || amount <= 0 || paymentInfo.isOverpaying} className="w-full py-4 bg-blue-600 text-white rounded-xl shadow-neumorph hover:bg-blue-700 disabled:opacity-50 font-bold">
                  Lanjutkan
                </button>
              </footer>
            </>
          ) : (
            <>
              <main className="p-4 space-y-4 flex-1 overflow-y-auto">
                 <div className="flex items-center gap-2 mb-2">
                    <button type='button' onClick={() => setModalStep('amount')} className="p-1.5 rounded-full hover:bg-gray-200/70">
                      <ArrowLeft size={18} className="text-gray-700"/>
                    </button>
                    <p className="text-sm text-gray-600">Kembali</p>
                 </div>
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
                {(method === 'transfer' || method === 'qris') && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Bukti Pembayaran</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                )}
              </main>
              <footer className="p-4 border-t border-gray-200/80 flex-shrink-0">
                <button type="submit" disabled={isSubmitting || isApiProcessing} className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-green-600 text-white hover:bg-green-700 shadow-neumorph disabled:bg-gray-400">
                  {isSubmitting || isApiProcessing ? ( <><Loader className="animate-spin" size={20} /> Memproses...</> ) : ( 'Konfirmasi Pembayaran' )}
                </button>
              </footer>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </form>
  );
}