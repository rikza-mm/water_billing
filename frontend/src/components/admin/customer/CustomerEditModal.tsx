"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Customer, CustomerUpdateData, AreaOption, CustomerCategory } from "@/hooks/admin/customer/useAdminCustomers";

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
  categories,
}: CustomerEditModalProps) {
  type Edit = CustomerUpdateData;
  const norm = (v: unknown) => (v === '' ? null : v);

  const [initial, setInitial] = useState<Edit | null>(null);
  const [editData, setEditData] = useState<CustomerUpdateData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (customerDetail && open) {
      const preset: Edit = {
        full_name: customerDetail.full_name || customerDetail.name || "",
        phone_number: customerDetail.phoneNumber || "",
        address: customerDetail.address || "",
        area_id: customerDetail.area_id ? String(customerDetail.area_id) : "",
        category_id: customerDetail.category_id ? String(customerDetail.category_id) : "",
        meter_number: customerDetail.meterNumber || customerDetail.meter_number || "",
      };
      setEditData(preset);
      setInitial(preset);
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    }
  }, [customerDetail, open]);

  const normalizeForSend = React.useCallback((values: Edit): Edit => {
    const out: Edit = {};
    if ('full_name' in values) out.full_name = (values.full_name ?? '').trim();
    if ('address' in values)   out.address   = (values.address ?? '').trim();
    if ('phone_number' in values) {
      const t = (values.phone_number ?? '').trim();
      out.phone_number = t === '' ? undefined : t;
    }
    if ('meter_number' in values) {
      const raw = (values.meter_number ?? '').toString().trim();
      out.meter_number = raw === '' ? undefined : raw.replace(/\D+/g,'').slice(0,5);
    }
    if ('area_id' in values) out.area_id = values.area_id ? String(values.area_id) : undefined;
    if ('category_id' in values) out.category_id = values.category_id ? String(values.category_id) : undefined;
    return out;
  }, []);

  const isDirty = React.useMemo(() => {
    if (!initial) return false;
    const now = normalizeForSend(editData);
    const start = normalizeForSend(initial);
    return JSON.stringify(now) !== JSON.stringify(start);
  }, [editData, initial, normalizeForSend]);

  if (!open) return null;
  // SSR guard + portal ke <body> agar konsisten dengan TransitionCustomerModal
  if (typeof window === "undefined" || !document.body) return null;

  const handleSaveEdit = async () => {
    if (!customerDetail) {
      toast.error("Data pelanggan tidak tersedia. Tutup lalu buka lagi.");
      return;
    }
    if (!editData.full_name?.trim()) return toast.error("Nama lengkap wajib diisi");
    if (!editData.address?.trim())   return toast.error("Alamat wajib diisi");
    if (editData.phone_number && editData.phone_number.trim()) {
      const digits = editData.phone_number.replace(/\D/g, "");
      if (digits.length < 10) return toast.error("Nomor telepon minimal 10 digit, atau kosongkan jika tidak ada.");
    }
    const normalized = normalizeForSend(editData);
    const start = normalizeForSend(initial || {});
    const changed: Edit = {};
    for (const k of Object.keys(normalized) as (keyof Edit)[]) {
      if (JSON.stringify(norm(normalized[k])) !== JSON.stringify(norm(start[k]))) {
        changed[k] = normalized[k];
      }
    }
    if (Object.keys(changed).length === 0) {
      toast("Tidak ada perubahan.");
      return;
    }
    // Final cast: meter_number -> number/null
    if (changed.meter_number !== undefined) {
      changed.meter_number = changed.meter_number === '' ? undefined : changed.meter_number;
    }
    setIsSubmitting(true);
    try {
      await onEdit(customerDetail.id, changed);
      toast.success("Data pelanggan berhasil diperbarui");
      onClose();
    } catch (e) {
      const errMsg = (e instanceof Error && e.message) ? e.message : "Gagal memperbarui data pelanggan";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose} />
      {/* sheet */}
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="customer-edit-title"
        className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="customer-edit-title" className="text-lg font-semibold text-gray-800">
            Edit Data Pelanggan
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 rounded-lg bg-[#e0e5ec] hover:shadow transition"
            aria-label="Tutup panel"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editData.full_name || ""}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Nomor Meter</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d*"
                maxLength={5}
                value={editData.meter_number || ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D+/g,'').slice(0,5);
                  setEditData({ ...editData, meter_number: v });
                }}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="Opsional"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Wilayah</label>
              <select
                value={editData.area_id || ""}
                onChange={(e) => setEditData({ ...editData, area_id: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
              >
                <option value="">Pilih Wilayah</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Kategori</label>
              <select
                value={editData.category_id || ""}
                onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">
                Nomor Telepon <span className="text-gray-500">(opsional)</span>
              </label>
              <input
                type="tel"
                value={editData.phone_number || ""}
                onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none"
                placeholder="0812… (min 10 digit jika diisi)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 font-medium mb-1">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editData.address || ""}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                className="w-full p-3 rounded-lg bg-[#d1d5dc] text-gray-800 outline-none resize-none"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              />
            </div>
          </div>
        </div>
        {/* footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-medium shadow hover:shadow-md transition"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={isSubmitting || !isDirty}
            className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium shadow hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center gap-2"
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
      </aside>
    </div>,
    document.body
  );
}
