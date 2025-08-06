import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface OfficerFormData {
  username: string;
  password?: string;
  full_name: string;
  phone_number: string;
  whatsapp_number?: string;
  salary?: number;
  is_active?: boolean;
}

interface AddOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfficerFormData) => Promise<boolean>;
  initialData?: OfficerFormData;
  isEdit?: boolean;
}

export function AddOfficerModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit
}: AddOfficerModalProps) {
  const [formData, setFormData] = useState<OfficerFormData>({
    username: initialData?.username || '',
    password: '',
    full_name: initialData?.full_name || '',
    phone_number: initialData?.phone_number || '',
    whatsapp_number: initialData?.whatsapp_number || '',
    salary: initialData?.salary || undefined,
    is_active: initialData?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        ...initialData,
        password: '', // password tidak diisi saat edit
      });
    }
    if (!isOpen) {
      setError(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        phone_number: '',
        whatsapp_number: '',
        salary: undefined,
        is_active: true,
      });
    }
  }, [isOpen, isEdit, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim()) return setError('Username wajib diisi');
    if (!isEdit && !formData.password?.trim()) return setError('Password wajib diisi');
    if (!formData.full_name.trim()) return setError('Nama lengkap wajib diisi');
    if (!formData.phone_number.trim()) return setError('Nomor telepon wajib diisi');

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Ensure SSR safety: only render portal if document.body exists
  if (typeof window === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{isEdit ? 'Edit Petugas' : 'Tambah Petugas'}</h2>
              <p className="text-sm text-gray-600">{isEdit ? 'Edit data petugas' : 'Isi data petugas dengan lengkap'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Username"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
                placeholder="Password"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Nama Lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Nomor Telepon"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp_number}
              onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Nomor WhatsApp (opsional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gaji</label>
            <input
              type="number"
              value={formData.salary ?? ''}
              onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              placeholder="Gaji (opsional)"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none"
              >
                <option value="true">Aktif</option>
                <option value="false">Tidak Aktif</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}