import { useState } from 'react';
import { X, User, MapPin, Phone, Home, Plus, Calendar, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AreaOption, CustomerCategory } from '@/hooks/admin/customer/useAdminCustomers';

type TransitionCustomerFormData = {
  full_name: string;
  area_id: string;
  category_id: string;
  phone_number: string;
  address: string;
  meter_number: string;
  registration_date: string;
  last_meter_reading: string;
  last_reading_date: string;
  initial_debt: string;
  initial_saldo: string;
  notes?: string;
};

interface TransitionCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransitionCustomerFormData) => Promise<void>;
  areas: AreaOption[];
  categories: CustomerCategory[];
}

// Helper to format number as Rupiah
function formatRupiah(value: string) {
  if (!value) return '';
  const number = parseInt(value.replace(/\D/g, ''), 10);
  if (isNaN(number)) return '';
  return 'Rp ' + number.toLocaleString('id-ID');
}

export function TransitionCustomerModal({
  isOpen,
  onClose,
  onSubmit,
  areas,
  categories,
}: TransitionCustomerModalProps) {
  const [formData, setFormData] = useState<TransitionCustomerFormData>({
    full_name: '',
    area_id: '',
    category_id: '',
    phone_number: '',
    address: '',
    meter_number: '',
    registration_date: '',
    last_meter_reading: '',
    last_reading_date: '',
    initial_debt: '',
    initial_saldo: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debug: log formData

    // Validasi: cek semua field kecuali notes
    const requiredFields = [
      'full_name',
      'area_id',
      'category_id',
      'phone_number',
      'address',
      'meter_number',
      'registration_date',
      'last_meter_reading',
      'last_reading_date',
      'initial_debt',
      'initial_saldo',
    ];
    for (const key of requiredFields) {
      const value = formData[key as keyof typeof formData];
      if (typeof value === 'undefined' || value === null || value.toString().trim().length === 0) {
        setError('Semua field wajib diisi, kecuali catatan.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
      setFormData({
        full_name: '',
        area_id: '',
        category_id: '',
        phone_number: '',
        address: '',
        meter_number: '',
        registration_date: '',
        last_meter_reading: '',
        last_reading_date: '',
        initial_debt: '',
        initial_saldo: '',
        notes: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal migrasi pelanggan');
      } else {
        setError('Gagal migrasi pelanggan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Transisi/Migrasi Pelanggan Lama</h2>
              <p className="text-sm text-gray-600">Isi data pelanggan lama dengan lengkap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama Lengkap */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Masukkan nama lengkap pelanggan"
            />
          </div>

          {/* Wilayah & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-purple-600" />
                Wilayah <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.area_id}
                onChange={e => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              >
                <option value="">Pilih Wilayah</option>
                {areas.map(area => (
                  <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                Kategori
              </label>
              <select
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nomor Meter & Nomor Telepon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home size={16} className="text-indigo-600" />
                Nomor Meter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.meter_number}
                onChange={e => setFormData({ ...formData, meter_number: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Masukkan nomor meter"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-teal-600" />
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>

          {/* Tanggal Registrasi & Tanggal Pembacaan Terakhir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-pink-600" />
                Tanggal Registrasi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.registration_date}
                onChange={e => setFormData({ ...formData, registration_date: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-pink-600" />
                Tanggal Pembacaan Terakhir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.last_reading_date}
                onChange={e => setFormData({ ...formData, last_reading_date: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              />
            </div>
          </div>

          {/* Pembacaan Meter Terakhir & Tunggakan Awal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home size={16} className="text-indigo-600" />
                Pembacaan Meter Terakhir <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.last_meter_reading}
                onChange={e => setFormData({ ...formData, last_meter_reading: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Masukkan angka meter terakhir"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home size={16} className="text-indigo-600" />
                Tunggakan Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formatRupiah(formData.initial_debt)}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, initial_debt: raw });
                }}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Masukkan tunggakan awal"
              />
            </div>
          </div>

          {/* Saldo Awal & Catatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home size={16} className="text-indigo-600" />
                Saldo Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formatRupiah(formData.initial_saldo)}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, initial_saldo: raw });
                }}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Masukkan saldo awal"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-gray-600" />
                Catatan (opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none resize-none"
                rows={2}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Home size={16} className="text-red-600" />
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none resize-none"
              rows={2}
              placeholder="Masukkan alamat lengkap pelanggan"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:bg-blue-600 hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Migrasi...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Migrasi Pelanggan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}