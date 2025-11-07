"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Users, User, Phone, DollarSign, FileText, Receipt } from "lucide-react";
import { CustomerDetail } from "@/hooks/admin/customer/useAdminCustomers";

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customerDetail: CustomerDetail | null;
  loading: boolean;
}

function formatCurrency(amount: string | number) {
  const numAmount = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<T[keyof T]>();
  return arr.filter((it) => {
    if (seen.has(it[key])) return false;
    seen.add(it[key]);
    return true;
  });
}

function getStatusBadge(status: string) {
  const config: Record<string, { color: string; text: string; icon: string }> = {
    active: { color: "bg-green-100 text-green-800 border-green-200", text: "Aktif", icon: "🟢" },
    suspended: { color: "bg-red-100 text-red-800 border-red-200", text: "Ditangguhkan", icon: "🔴" },
    inactive: { color: "bg-gray-100 text-gray-800 border-gray-200", text: "Tidak Aktif", icon: "⚪" },
    paid: { color: "bg-green-100 text-green-800 border-green-200", text: "Lunas", icon: "✅" },
    unpaid: { color: "bg-red-100 text-red-800 border-red-200", text: "Belum Lunas", icon: "❌" },
    overdue: { color: "bg-orange-100 text-orange-800 border-orange-200", text: "Terlambat", icon: "⚠️" },
  };
  const badge = config[status] || config.inactive;
  return (
    <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full border ${badge.color}`}>
      <span>{badge.icon}</span>
      {badge.text}
    </span>
  );
}

export function CustomerDetailModal({ open, onClose, customerDetail, loading }: CustomerDetailModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;
  // SSR guard + portal ke <body> agar konsisten dengan TransitionCustomerModal
  if (typeof window === "undefined" || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="customer-detail-title"
        className="relative z-10 bg-[#e0e5ec] rounded-2xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] w-[min(100vw-1rem,980px)] sm:w-[min(100vw-3rem,980px)] max-h-[90vh] flex flex-col"
      >
        {/* HEADER — sticky */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-[#d1d5dc] border-b border-gray-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 id="customer-detail-title" className="text-lg font-semibold text-gray-800">
                Detail Pelanggan
              </h2>
              <p className="text-sm text-gray-600">Informasi lengkap pelanggan</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 rounded-lg bg-[#e0e5ec] hover:shadow transition"
            aria-label="Tutup panel"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        {/* BODY — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Memuat detail pelanggan...</p>
              </div>
            </div>
          ) : !customerDetail || !customerDetail.profile ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Data Tidak Ditemukan</h3>
              <p className="text-gray-500">Detail pelanggan tidak dapat dimuat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info dasar */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Informasi Dasar</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nama Pelanggan</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">ID Pelanggan</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <div className="mt-1">{getStatusBadge(customerDetail.profile.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Wilayah</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.area || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Kategori</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.category_name || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Kontak & Alamat */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Kontak & Alamat</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nomor Telepon</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Alamat</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.address || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Keuangan */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Status Keuangan</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Saldo</p>
                    <p className="text-sm font-semibold text-green-700">{formatCurrency(customerDetail.profile.saldo || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Hutang</p>
                    <p className="text-sm font-semibold text-red-700">{formatCurrency(customerDetail.profile.hutang || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Ringkasan Tagihan & Pembayaran — side-by-side di desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ringkasan 7 Tagihan Terakhir */}
                <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Ringkasan 7 Tagihan Terakhir</h3>
                  </div>
                  <div className="space-y-2">
                    {customerDetail.billingHistory && customerDetail.billingHistory.length > 0 ? (
                      uniqueBy(customerDetail.billingHistory, "bill_id")
                        .slice(0, 7)
                        .map((bill) => (
                          <div key={`bill_${bill.bill_id}`} className="grid grid-cols-3 gap-2 text-sm p-2 rounded-lg hover:bg-white/50">
                            <div>{new Date(bill.period_start).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - {new Date(bill.period_end).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</div>
                            <div className="font-semibold text-gray-800 text-right">{formatCurrency(bill.amount)}</div>
                            <div className="text-right">{getStatusBadge(bill.bill_status)}</div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center p-4">Tidak ada riwayat tagihan.</p>
                    )}
                  </div>
                </div>

                {/* 5 Pembayaran Terakhir */}
                <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">5 Pembayaran Terakhir</h3>
                  </div>
                  <div className="space-y-2">
                    {customerDetail.paymentHistory && customerDetail.paymentHistory.length > 0 ? (
                      uniqueBy(customerDetail.paymentHistory, "payment_id")
                        .slice(0, 5)
                        .map((payment) => (
                          <div key={`payment_${payment.payment_id}`} className="grid grid-cols-3 gap-2 text-sm p-2 rounded-lg hover:bg-white/50">
                            <div>{new Date(payment.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="font-semibold text-gray-800 text-right">{formatCurrency(payment.amount)}</div>
                            <div className="text-right capitalize">{String(payment.method)}</div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center p-4">Tidak ada riwayat pembayaran.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
