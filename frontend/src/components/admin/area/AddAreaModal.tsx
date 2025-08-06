import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { area_name: string; postal_code?: string }) => Promise<boolean>;
  initialData?: { area_name?: string; postal_code?: string };
  isEdit?: boolean;
}

export function AddAreaModal({ isOpen, onClose, onSubmit, initialData, isEdit }: AddAreaModalProps) {
  const [formData, setFormData] = useState({
    area_name: initialData?.area_name || '',
    postal_code: initialData?.postal_code || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.area_name.trim()) {
      setError('Nama area wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);
    if (success) {
      setFormData({ area_name: '', postal_code: '' });
    }
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-md shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{isEdit ? 'Edit Area' : 'Tambah Area'}</h2>
              <p className="text-sm text-gray-600">{isEdit ? 'Edit data area' : 'Isi data area dengan lengkap'}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.area_name}
              onChange={e => setFormData({ ...formData, area_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              placeholder="Masukkan nama area"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Pos
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_1px_1px_3px_#bebebe,inset_-1px_-1px_3px_#ffffff] transition-all duration-200"
              placeholder="Masukkan kode pos (opsional)"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              {isEdit ? 'Update' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
} 