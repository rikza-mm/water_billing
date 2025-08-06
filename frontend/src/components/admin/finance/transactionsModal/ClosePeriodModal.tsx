import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, X, AlertTriangle } from 'lucide-react';

// Props untuk komponen modal
interface ClosePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: {
    start: string;
    end: string;
  };
  onConfirm: (startDate: string, endDate: string) => Promise<{ success: boolean; message: string; data?: unknown }>;
}

export function ClosePeriodModal({ isOpen, onClose, dateRange, onConfirm }: ClosePeriodModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setResult(null);
    
    const response = await onConfirm(dateRange.start, dateRange.end);
    setResult(response);
    setIsLoading(false);
    
    // Auto close jika berhasil
    if (response.success) {
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setResult(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-sm bg-black/30" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Wallet size={24} className="text-red-600" />
            Konfirmasi Tutup Buku Periode
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-800">PERINGATAN PENTING</p>
              </div>
            </div>
            
            <p className="text-gray-700">
              Anda akan menutup periode keuangan dari 
              <b className="text-blue-600"> {formatDate(dateRange.start)} </b> 
              sampai 
              <b className="text-blue-600"> {formatDate(dateRange.end)}</b>.
              <br/><br/>
              Proses ini <b className="text-red-600 font-bold">tidak dapat dibatalkan</b> dan akan mencatat laba/rugi ke dalam modal secara permanen.
            </p>
            
            <div className="flex justify-end gap-2 pt-4">
              <button 
                onClick={handleClose} 
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                disabled={isLoading}
              >
                Batal
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={isLoading} 
                className="button-neumorphic-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Memproses...' : 'Ya, Konfirmasi Tutup Buku'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex flex-col items-center text-center ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.success ? 
                <div className="text-green-600 mb-2 text-4xl">✅</div> :
                <AlertTriangle size={40} className="text-red-600 mb-2" />
              }
              <h3 className={`text-lg font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Proses Berhasil' : 'Proses Gagal'}
              </h3>
              <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleClose} 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}