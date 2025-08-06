import { useState } from 'react';
import { X, User, MapPin, Phone, Home, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AreaOption, CustomerCategory } from '@/hooks/admin/customer/useAdminCustomers';

type CustomerFormData = {
  full_name: string;
  area_id: string;
  category_id: string;
  phone_number: string;
  address: string;
  meter_number?: string;
};

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  areas: AreaOption[];
  categories: CustomerCategory[];
}

export function AddCustomerModal({ isOpen, onClose, onSubmit, areas, categories }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: '',
    area_id: '',
    category_id: '',
    phone_number: '',
    address: '',
    meter_number: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validasi form
    if (!formData.full_name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!formData.area_id) {
      setError('Wilayah wajib dipilih');
      return;
    }
    if (!formData.phone_number.trim()) {
      setError('Nomor telepon wajib diisi');
      return;
    }
    if (!formData.address.trim()) {
      setError('Alamat wajib diisi');
      return;
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
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Gagal menambah pelanggan');
      } else {
        setError('Gagal menambah pelanggan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Tambah Pelanggan Baru</h2>
              <p className="text-sm text-gray-600">Isi data pelanggan dengan lengkap</p>
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
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              placeholder="Masukkan nama lengkap pelanggan"
            />
          </div>

          {/* Wilayah dan Kategori dalam satu baris */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wilayah */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-purple-600" />
                Wilayah <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.area_id}
                onChange={e => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              >
                <option value="">Pilih Wilayah</option>
                {areas.map(area => (
                  <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                Kategori
              </label>
              <select
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nomor Meter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Home size={16} className="text-indigo-600" />
              Nomor Meter
            </label>
            <input
              type="text"
              value={formData.meter_number}
              onChange={e => setFormData({ ...formData, meter_number: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              placeholder="Masukkan nomor meter (opsional)"
            />
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-orange-600" />
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              placeholder="Contoh: 081234567890"
            />
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
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200 resize-none"
              rows={3}
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
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Simpan Pelanggan
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
