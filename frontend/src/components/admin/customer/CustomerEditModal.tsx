import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Customer, CustomerUpdateData, AreaOption, CustomerCategory } from '@/hooks/admin/customer/useAdminCustomers';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CustomerEditModalProps {
  open: boolean;
  onClose: () => void;
  customerDetail: Customer | null;
  onEdit: (customerId: number, data: CustomerUpdateData) => Promise<void>;
  areas: AreaOption[];
  categories: CustomerCategory[];
}

export function CustomerEditModal({
  open,
  onClose,
  customerDetail,
  onEdit,
  areas,
  categories
}: CustomerEditModalProps) {
  const [editData, setEditData] = useState<CustomerUpdateData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerDetail && open) {
      setEditData({
        full_name: customerDetail.full_name || customerDetail.name || '',
        phone_number: customerDetail.phoneNumber || '',
        address: customerDetail.address || '',
        area_id: customerDetail.area_id ? String(customerDetail.area_id) : '',
        category_id: customerDetail.category_id ? String(customerDetail.category_id) : '',
        meter_number: customerDetail.meter_number || customerDetail.meterNumber || '',
      });
    }
  }, [customerDetail, open]);

  const handleSaveEdit = async () => {
    if (!customerDetail) return;
    if (!editData.full_name?.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }
    if (!editData.phone_number?.trim()) {
      toast.error('Nomor telepon wajib diisi');
      return;
    }
    if (!editData.address?.trim()) {
      toast.error('Alamat wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToUpdate: CustomerUpdateData = {};
      Object.entries(editData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          dataToUpdate[key as keyof CustomerUpdateData] = value;
        }
      });
      await onEdit(customerDetail.id, dataToUpdate);
      toast.success('Data pelanggan berhasil diperbarui');
      onClose();
    } catch (error) {
      toast.error((error as Error).message || 'Gagal memperbarui data pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full bg-[#e0e5ec] rounded-2xl p-0 overflow-hidden">
        <div className="bg-[#d1d5dc] px-6 py-4 border-b border-gray-200/50 flex items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-800">Edit Data Pelanggan</DialogTitle>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#e0e5ec] hover:shadow transition-all duration-200"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editData.full_name || ''}
                onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Nomor Meter</label>
              <input
                type="text"
                value={editData.meter_number || ''}
                onChange={e => setEditData({ ...editData, meter_number: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Wilayah</label>
              <select
                value={editData.area_id || ''}
                onChange={e => setEditData({ ...editData, area_id: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
              >
                <option value="">Pilih Wilayah</option>
                {areas.map(area => (
                  <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Kategori</label>
              <select
                value={editData.category_id || ''}
                onChange={e => setEditData({ ...editData, category_id: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={editData.phone_number || ''}
                onChange={e => setEditData({ ...editData, phone_number: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="Contoh: 081234567890"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Alamat <span className="text-red-500">*</span></label>
              <textarea
                value={editData.address || ''}
                onChange={e => setEditData({ ...editData, address: e.target.value })}
                className="w-full p-2 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none resize-none"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-medium shadow hover:shadow-md transition-all duration-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium shadow hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 