// file: components/admin/profile/AdminSettingsForm.tsx

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/admin/settings/useSettings';
import { Loader, Save, Settings, X, UploadCloud } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Asumsikan Anda memiliki file ini dari langkah sebelumnya
import { uploadImageToCloudinary } from '@/utils/directUploader';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const { settings, saving, error, fetchSettings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // 1. TAMBAHKAN: State untuk mengelola file dan status upload QRIS
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [fetchSettings, isOpen]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
  };
  
  // 2. BUAT: Fungsi untuk menangani proses upload QRIS
  const handleQrisUpload = async () => {
    if (!qrisFile) {
        toast.error("Pilih file gambar QRIS terlebih dahulu.");
        return;
    }
    
    setIsUploading(true);
    const toastId = toast.loading("Mengunggah gambar QRIS...");

    try {
        const finalUrl = await uploadImageToCloudinary(qrisFile, 'qris_codes');
        // Update state lokal dengan URL baru dari Cloudinary
        setLocalSettings(prev => ({ ...prev, qris_image_url: finalUrl }));
        toast.success("Gambar QRIS berhasil diunggah!", { id: toastId });
        setQrisFile(null); // Reset pilihan file setelah berhasil
    } catch (uploadError) {
        const errorMsg = uploadError instanceof Error ? uploadError.message : "Gagal mengunggah gambar.";
        toast.error(errorMsg, { id: toastId });
    } finally {
        setIsUploading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(localSettings);
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings /> Pengaturan Aplikasi</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input untuk Rekening BCA dan Mandiri tetap sama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening BCA</label>
            <input
              type="text"
              name="bank_account_bca"
              value={localSettings.bank_account_bca || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Contoh: 1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening Mandiri</label>
            <input
              type="text"
              name="bank_account_mandiri"
              value={localSettings.bank_account_mandiri || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Contoh: 9876543210"
            />
          </div>
          
          {/* 3. GANTI: Blok JSX untuk input QRIS */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Gambar QRIS</label>
            {localSettings.qris_image_url && (
                <div className="my-2">
                    <p className="text-xs mb-1">Gambar saat ini:</p>
                    <Image src={localSettings.qris_image_url || '/placeholder.png'} alt="QRIS Preview" width={128} height={128} className="object-contain border rounded bg-white p-1" />
                </div>
            )}
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setQrisFile(e.target.files ? e.target.files[0] : null)}
                    className="flex-grow w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                />
                <button
                    type="button"
                    onClick={handleQrisUpload}
                    disabled={!qrisFile || isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? <Loader className="animate-spin" size={16}/> : <UploadCloud size={16} />}
                    <span>{isUploading ? '...' : 'Unggah'}</span>
                </button>
            </div>
          </div>

          {/* Input untuk Google Maps tetap sama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Google Maps Kantor</label>
            <input
              type="text"
              name="Maps_url"
              value={localSettings.Maps_url || ''}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Contoh: https://maps.app.goo.gl/..."
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={saving || isUploading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2 text-base"
          >
            {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}