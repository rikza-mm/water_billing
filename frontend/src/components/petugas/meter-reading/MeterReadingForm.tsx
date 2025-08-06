import { useState } from 'react';
import { ChevronLeft, User, Droplet, Calendar, FileText, Camera, X, RefreshCw, Tag, ChevronRight, Phone, Loader, Check, ChevronDown } from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { formatRupiah } from '@/utils/formatters';
import type { CustomerSearchResult as CustomerData } from '@/hooks/petugas/meter-reading/useCustomerSearch';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { uploadImageToCloudinary } from '@/utils/directUploader';
import { motion, AnimatePresence } from 'framer-motion';

interface MeterReadingSubmitData {
  currentReading: number;
  readingDate: string;
  notes?: string;
  photoUrl?: string; // Cloudinary URL
}

interface MeterReadingFormProps {
  customer: CustomerData;
  onSubmit: (data: MeterReadingSubmitData) => void;
  onBack: () => void;
  isLoading: boolean;
  onCustomerUpdate: (updatedCustomer: CustomerData) => void;
}

// BARU: Pemetaan detail tarif yang mencerminkan tabel 'water_rates' di database
const rateDetailsByCategory: { [key: number]: { rate_per_cubic: number; minimum_usage: number } } = {
  // Data ini disesuaikan dengan isi tabel 'water_rates' dari file tagihan_air.sql
  1: { rate_per_cubic: 5000, minimum_usage: 2 },  // Kategori 1: Rumah Tangga
  2: { rate_per_cubic: 3000, minimum_usage: 2 },  // Kategori 2: Sosial (Masjid)
  3: { rate_per_cubic: 3500, minimum_usage: 2 },  // Kategori 3: Sosial (Umum)
  4: { rate_per_cubic: 8000, minimum_usage: 10 }, // Kategori 4: Komersial
};

const DEFAULT_RATE_DETAILS = { rate_per_cubic: 5000, minimum_usage: 0 };

// DIPERBARUI: Fungsi ini sekarang mereplikasi logika Stored Procedure
const calculateEstimatedBill = (usage: number, categoryId?: number): number => {
  const details = (categoryId !== undefined && rateDetailsByCategory[categoryId]) 
    ? rateDetailsByCategory[categoryId] 
    : DEFAULT_RATE_DETAILS;

  // Logika dari `GREATEST(v_usage, v_min_usage)` di stored procedure
  const billableUsage = Math.max(usage, details.minimum_usage);

  return billableUsage * details.rate_per_cubic;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime())
      ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : dateString;
  } catch {
    return dateString;
  }
};

const formatMeter = (value: number) => (Number.isInteger(value) ? value : parseFloat(value.toString()));

export default function MeterReadingForm({ customer, onSubmit, onBack, isLoading, onCustomerUpdate }: MeterReadingFormProps) {
  const [currentReading, setCurrentReading] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [readingDate, setReadingDate] = useState<string>(formatDate(new Date().toISOString()));
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false); // Prevent duplicate uploads
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber || ''); // Restore phoneNumber state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // Restore photoPreview state
  const [activeSection, setActiveSection] = useState<'photo' | 'notes' | 'phone' | null>(null);

  const currentReadingNum = parseFloat(currentReading) || 0;
  const usage = Math.max(0, currentReadingNum - (customer.lastReading ?? 0));
  
  // DIPERBARUI: Panggil fungsi baru dengan menyertakan category_id dari customer
  const estimatedBill = calculateEstimatedBill(usage, customer.category_id);

  // ✅ Fungsi baru untuk menyimpan nomor telepon
  const handleSavePhone = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Format nomor telepon tidak valid.');
      return;
    }
    setIsSavingPhone(true);
    setPhoneSaveSuccess(false);
    try {
      const response = await axios.put(
        `/petugas/customers/${customer.id}/phone`,
        { phone_number: phoneNumber }
      );
      if (response.data.success) {
        toast.success(response.data.message || 'Nomor telepon berhasil disimpan!');
        setPhoneSaveSuccess(true);
        // Notify parent about updated customer
        onCustomerUpdate({
          ...customer,
          phoneNumber: phoneNumber,
        });
      } else {
        toast.error(response.data.message || 'Gagal menyimpan nomor.');
      }
    } catch {
      toast.error('Terjadi kesalahan pada server saat menyimpan nomor.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  // ✅ FUNGSI BARU UNTUK MENGHAPUS FOTO
  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPhotoUploading) return;
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setIsPhotoUploading(true);
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const url = await uploadImageToCloudinary(compressedFile, 'meter_proofs');
      setPhotoUrl(url);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(compressedFile));
      toast.success('Foto meter berhasil diunggah!');
    } catch {
      toast.error('Gagal memproses gambar');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleSubmit = () => {
    setFormError(null);
    if (!currentReading.trim()) {
      setFormError('Angka meter harus diisi');
      return;
    }
    if (customer.lastReading !== undefined && currentReadingNum < customer.lastReading) {
      setFormError('Angka meter tidak boleh lebih kecil dari pembacaan sebelumnya');
      return;
    }
    if (customer.lastReadingDate) {
      if (new Date(readingDate).getTime() <= new Date(customer.lastReadingDate).getTime()) {
        setFormError(`Tanggal pembacaan harus setelah ${formatDateForDisplay(customer.lastReadingDate)}`);
        return;
      }
    }
    if (!photoUrl) {
      setFormError('Foto meter wajib diunggah');
      return;
    }
    setFormError(null);
    onSubmit({ currentReading: currentReadingNum, readingDate, notes, photoUrl });
  };

  // Clear error on input change
  const handleCurrentReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentReading(e.target.value.replace(/[^0-9.]/g, ''));
    setFormError(null);
  };
  const handleReadingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReadingDate(e.target.value);
    setFormError(null);
  };
  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPhotoUploading) return; // Prevent duplicate upload
    handlePhotoChange(e);
    setFormError(null);
  };

  const handleSectionToggle = (section: 'photo' | 'notes' | 'phone') => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  return (
    <div className="relative space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] space-y-5">
        
        {/* Customer Info Header */}
        <div className="flex items-center gap-4">
          <div className="bg-[#e0e5ec] p-3 rounded-full shadow-neumorph flex-shrink-0">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base leading-tight">{customer.name}</h3>
            <p className="text-sm text-gray-500">ID: {customer.id}</p>
          </div>
        </div>

        {/* Customer Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-300/50">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1"><Droplet size={12}/> Bacaan Terakhir</p>
            <p className="text-xl font-bold text-gray-700">{customer.lastReading !== undefined ? formatMeter(customer.lastReading) : '-'} <span className="text-lg font-normal">m³</span></p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1"><Calendar size={12}/> Tgl. Baca Terakhir</p>
            <p className="font-medium text-gray-700">{customer.lastReadingDate ? formatDateForDisplay(customer.lastReadingDate) : 'N/A'}</p>
          </div>
              </div>
        {customer.category_name && (
          <div className="pt-3 border-t border-gray-300/40">
            <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full font-semibold flex items-center gap-1.5 w-fit">
              <Tag size={12} />{customer.category_name}
              </span>
            </div>
          )}

        {/* Meter & Date Input Section */}
        <div className="pt-5 border-t border-gray-300/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Angka Meter Saat Ini</label>
              <div className="relative">
                <input type="text" value={currentReading} onChange={handleCurrentReadingChange}
                  className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={`Min: ${customer.lastReading !== undefined ? formatMeter(customer.lastReading) : 0}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">m³</span>
        </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Tanggal Pembacaan</label>
              <input type="date" value={readingDate} onChange={handleReadingDateChange}
                className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
            </div>

        {/* Photo Upload */}
        <div className="pt-5 border-t border-gray-300/50 space-y-3">
          {/* Foto Meter Section */}
          <div>
            <button
              type="button"
              onClick={() => handleSectionToggle('photo')}
              className="w-full flex justify-between items-center p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed transition-all"
            >
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Camera size={16}/> Foto Meter (Wajib)
              </span>
              <div className="flex items-center gap-2">
                {photoUrl && <Check size={18} className="text-green-500" />}
                <ChevronDown size={20} className={`transform transition-transform ${activeSection === 'photo' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {activeSection === 'photo' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pl-2">
                    {photoPreview ? (
                      <div className="relative group w-fit">
                        <Image
                          src={photoPreview}
                          alt="Preview Foto Meter"
                          width={160}
                          height={160}
                          className="w-40 h-40 object-cover rounded-xl border border-gray-300"
                          unoptimized
                        />
                        {/* Overlay loading di atas gambar preview saat re-upload */}
                        {isPhotoUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                            <Loader className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-red-100 transition-all"
                          disabled={isPhotoUploading}
                          type="button"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoInputChange}
                        disabled={isPhotoUploading || isLoading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    )}
                    {/* Indikator loading baru yang lebih halus */}
                    {isPhotoUploading && !photoPreview && (
                      <div className="mt-2 text-xs text-blue-600 flex items-center gap-2 animate-fade-in">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengunggah foto...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Catatan Section */}
          <div>
            <button
              type="button"
              onClick={() => handleSectionToggle('notes')}
              className="w-full flex justify-between items-center p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed transition-all"
            >
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={16}/> Catatan (Opsional)
              </span>
              <ChevronDown size={20} className={`transform transition-transform ${activeSection === 'notes' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeSection === 'notes' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pl-2">
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      rows={3}
                      placeholder="Tulis catatan tambahan di sini (misal: kondisi meter, lokasi, dsb)"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Nomor Telepon Section */}
          <div>
            <button
              type="button"
              onClick={() => handleSectionToggle('phone')}
              className="w-full flex justify-between items-center p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed transition-all"
            >
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Phone size={16}/> Nomor Telepon / WA
              </span>
              <div className="flex items-center gap-2">
                {phoneSaveSuccess && <Check size={18} className="text-green-500" />}
                <ChevronDown size={20} className={`transform transition-transform ${activeSection === 'phone' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {activeSection === 'phone' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pl-2">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setPhoneSaveSuccess(false);
                        }}
                        className="flex-grow p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 font-medium focus:outline-none w-full sm:w-auto"
                        placeholder="Contoh: 08123456789"
                        disabled={isSavingPhone || phoneSaveSuccess}
                      />
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        disabled={isSavingPhone || phoneSaveSuccess || !phoneNumber}
                        className="w-full sm:w-[100px] py-3 rounded-xl bg-green-500 text-white font-bold shadow-neumorph transition-all hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSavingPhone ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : phoneSaveSuccess ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          'Simpan'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Nomor ini akan digunakan untuk mengirim struk via WhatsApp.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Catatan */}
        {/* <div className="pt-5 border-t border-gray-300/50">
          <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
            <FileText size={16}/> Catatan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            rows={3}
            placeholder="Tulis catatan tambahan di sini (misal: kondisi meter, lokasi, dsb)"
            disabled={isLoading}
          />
        </div> */}

        {/* ✅ TAMBAHAN: Form Input Nomor Telepon / WA */}
        {/* <div className="pt-5 border-t border-gray-300/50">
          <label className="text-sm font-medium text-gray-600 block mb-2 items-center gap-1.5">
            <Phone size={14}/> Nomor Telepon / WA
          </label>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPhoneSaveSuccess(false);
              }}
              className="flex-grow p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-gray-700 font-medium focus:outline-none w-full sm:w-auto"
              placeholder="Contoh: 08123456789"
              disabled={isSavingPhone || phoneSaveSuccess}
            />
            <button
              type="button"
              onClick={handleSavePhone}
              disabled={isSavingPhone || phoneSaveSuccess || !phoneNumber}
              className="w-full sm:w-[100px] py-3 rounded-xl bg-green-500 text-white font-bold shadow-neumorph transition-all hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSavingPhone ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : phoneSaveSuccess ? (
                <Check className="w-5 h-5" />
              ) : (
                'Simpan'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Nomor ini akan digunakan untuk mengirim struk via WhatsApp.
          </p>
        </div> */}
      </div>

      {/* Usage Summary */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
        <h4 className="text-md font-medium text-gray-700 mb-3">Ringkasan Penggunaan</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center"><span className="text-gray-600">Pembacaan Sebelumnya</span><span className="font-medium text-gray-700">{customer.lastReading !== undefined ? formatMeter(customer.lastReading) : '-'} m³</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-600">Pembacaan Saat Ini</span><span className="font-medium text-gray-700">{formatMeter(currentReadingNum)} m³</span></div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-300/50"><span className="text-gray-600">Total Pemakaian</span><span className="font-bold text-lg text-gray-800">{formatMeter(usage)} m³</span></div>
          <div className="flex justify-between items-center bg-blue-100/60 p-2 rounded-lg mt-2">
            <span className="font-semibold text-blue-800">Estimasi Tagihan</span>
            <span className="text-xl font-bold text-blue-600">{formatRupiah(estimatedBill)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {formError && (
        <div className="p-3 rounded-xl bg-red-50 shadow-neumorph text-sm mb-2">
          <div className="flex items-center gap-2 text-red-700">
            <X size={18} />
            <p className="font-medium">{formError}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2">
        <button onClick={onBack} disabled={isLoading} className="flex-1 py-4 rounded-xl bg-[#e0e5ec] shadow-neumorph text-gray-600 font-medium transition-all hover:shadow-neumorph-pressed disabled:opacity-50 flex items-center justify-center gap-2">
          <ChevronLeft size={20} /><span>Kembali</span>
        </button>
        <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-bold shadow-neumorph transition-all hover:bg-blue-700 disabled:opacity-75 flex items-center justify-center gap-2">
          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight size={20}/>}
          <span>{isLoading ? 'Memproses...' : 'Lanjutkan'}</span>
        </button>
      </div>
    </div>
  );
}
