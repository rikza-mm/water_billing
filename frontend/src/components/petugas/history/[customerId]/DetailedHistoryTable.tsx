'use client';

import React, { useState, useMemo } from 'react';
import { DetailedHistory } from '@/hooks/petugas/history/useHistoryDashboard';
import { safeNumber, safeCurrency } from '@/utils/numberUtils';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Droplets,
  Info,
  ChevronUp,
  Receipt,
  TrendingUp,
  Camera,
  MessageSquare,
  HandCoins,
  User
} from 'lucide-react';
import Image from 'next/image';
import { formatMeterNumber, formatWaterUsage } from '@/utils/formatters';
import { motion } from 'framer-motion';
import { AnimatedList, itemVariants } from '@/components/common/AnimatedList';
import { Modal } from '@/components/common/Modal';

interface DetailedHistoryTableProps {
  history: DetailedHistory[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  onPayBillClick: (bill: DetailedHistory) => void;
}

// Add helper for payment breakdown
function getPaymentBreakdownNumber(item: unknown, key: 'from_debt_payment' | 'from_current_payment' | 'from_excess_balance'): number {
  if (
    item && typeof item === 'object' &&
    'paymentBreakdown' in item &&
    item.paymentBreakdown && typeof item.paymentBreakdown === 'object'
  ) {
    const pb = item.paymentBreakdown as Record<string, unknown>;
    if (key in pb && typeof pb[key] === 'number') {
      return pb[key] as number;
    }
  }
  return 0;
}

// Add helper for paymentAllocations
function hasPaymentAllocations(item: unknown): boolean {
  return !!(
    item && typeof item === 'object' &&
    'paymentAllocations' in item &&
    Array.isArray((item as { paymentAllocations?: unknown }).paymentAllocations) &&
    ((item as { paymentAllocations?: unknown[] }).paymentAllocations?.length ?? 0) > 0
  );
}

// Add helper for isOverdue
function isOverdue(item: unknown): boolean {
  return !!(
    item && typeof item === 'object' &&
    'isOverdue' in item &&
    typeof (item as { isOverdue?: unknown }).isOverdue === 'boolean' &&
    (item as { isOverdue: boolean }).isOverdue
  );
}

// Add helper for daysPastDue
function getDaysPastDue(item: unknown): string {
  if (
    item && typeof item === 'object' &&
    'daysPastDue' in item &&
    (typeof (item as { daysPastDue?: unknown }).daysPastDue === 'string' || typeof (item as { daysPastDue?: unknown }).daysPastDue === 'number')
  ) {
    return String((item as { daysPastDue: string | number }).daysPastDue);
  }
  return '';
}

// Add helper for notes
function getNotes(item: unknown): string {
  if (
    item && typeof item === 'object' &&
    'notes' in item &&
    typeof (item as { notes?: unknown }).notes === 'string'
  ) {
    return (item as { notes: string }).notes;
  }
  return '';
}

const DetailedHistoryTable: React.FC<DetailedHistoryTableProps> = ({
  history,
  formatCurrency,
  formatDate,
  onPayBillClick
}) => {
  // State untuk modal preview gambar
  const [openImage, setOpenImage] = useState<null | { url: string; info: string; officer: string; date: string }>(null);

  // ✅ State untuk catatan
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // ✅ Fungsi toggle untuk catatan
  const toggleNotesExpansion = (itemId: string) => {
    setExpandedNotesId(currentId => (currentId === itemId ? null : itemId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Lunas
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle size={12} />
            Belum Bayar
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle size={12} />
            Tunggakan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Info size={12} />
            {status}
          </span>
        );
    }
  };

  // ✅ OPTIMASI: Kalkulasi semua summary dalam satu kali iterasi dengan useMemo
  const paymentSummary = useMemo(() => {
    let totalCash = 0;
    let totalTransfer = 0;
    let totalQris = 0;

    history.forEach(item => {
      const allocations = ((item as unknown) as Record<string, unknown>).paymentAllocations as { method: string }[] | undefined;
      if (allocations) {
        allocations.forEach((p) => {
          if (p.method === 'cash') totalCash++;
          if (p.method === 'transfer') totalTransfer++;
          if (p.method === 'qris') totalQris++;
        });
      }
    });

    return { totalCash, totalTransfer, totalQris };
  }, [history]);

  return (
    <div className="bg-[#e0e5ec] rounded-xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] overflow-hidden">
      {/* Modal Preview Gambar Meteran - Menggunakan Modal Portal */}
      <Modal 
        isOpen={!!openImage} 
        onClose={() => setOpenImage(null)}
        title="Foto Meteran"
      >
        {openImage && (
          <div className="p-4">
            <div className="mb-4">
              <Image 
                src={openImage.url} 
                alt="Foto Meteran" 
                width={400} 
                height={300} 
                className="w-full rounded-lg shadow-lg" 
                style={{objectFit:'contain'}} 
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Periode: {openImage.info}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>Petugas: {openImage.officer}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Tanggal Baca: {openImage.date}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Header */}
      <div className="bg-[#e0e5ec] p-4 sm:p-6 border-b border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Riwayat Detail Tagihan</h3>
              <p className="text-sm text-gray-600">
                {history.length} periode tagihan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View - Konsisten dengan Admin */}
      <div className="block lg:hidden">
        <AnimatedList>
        {history.map((item, index) => (
            <motion.div key={`mobile-${String(item.bill_id)}-${item.payment_id || index}`} variants={itemVariants}>
              <div className="border-b border-gray-100 last:border-b-0">
            <div className={`p-4 ${isOverdue(item) ? 'bg-red-50' : 'bg-[#e0e5ec]'}`}>
              {/* Header Card */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                          {formatDate(item.period_start)} - {formatDate(item.period_end)}
                    </div>
                        <div className="text-xs text-gray-600">Petugas: {item.officer_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                      {getStatusBadge(item.bill_status)}
                  {isOverdue(item) && (
                    <div className="bg-red-100 px-2 py-1 rounded-full">
                      <span className="text-xs text-red-700 font-medium">
                        {getDaysPastDue(item)} hari
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-gray-600">Pemakaian</span>
                  </div>
                      <div className="font-semibold text-gray-800">
                        {formatWaterUsage(item.water_usage)}
                      </div>
                  <div className="text-xs text-gray-500">
                        {formatMeterNumber(item.previous_reading)} → {formatMeterNumber(item.current_reading)}
                  </div>
                </div>

                <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-600">Tagihan</span>
                  </div>
                      <div className="font-semibold text-gray-800">{formatCurrency(Number(item.amount))}</div>
                </div>

                <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-600">Dibayar</span>
                  </div>
                  <div className={`font-semibold ${
                        Number(item.paid_amount) > 0 ? 'text-green-700' : 'text-gray-500'
                  }`}>
                        {Number(item.paid_amount) > 0
                          ? formatCurrency(Number(item.paid_amount))
                      : 'Rp0'
                    }
                  </div>
                      {item.payment_date && (
                    <div className="text-xs text-gray-500">
                          {formatDate(item.payment_date)}
                    </div>
                  )}
                </div>

                <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-gray-600">Jatuh Tempo</span>
                  </div>
                  <div className="font-semibold text-red-700">
                        {formatDate(item.due_date)}
                  </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex justify-between items-center gap-3 mt-4">
                    {/* TOMBOL BAYAR (KIRI, DIPERBESAR, GAYA NEUMORPH) */}
                    {item.bill_status === 'unpaid' ? (
                      <button
                        onClick={() => onPayBillClick(item)}
                        className="flex-grow py-2.5 px-4 rounded-lg bg-[#e0e5ec] text-green-600 shadow-neumorph hover:shadow-neumorph-pressed transition-all flex items-center justify-center gap-2"
                        title="Bayar Tagihan Ini"
                      >
                        <HandCoins size={16} />
                        <span className="font-semibold text-sm">Bayar Tagihan</span>
                      </button>
                    ) : (
                      <div className="flex-grow"></div> 
                    )}

                    {/* Grup Tombol Kanan (Catatan & Foto) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.image_url && (
                        <button
                          onClick={() => setOpenImage({
                            url: item.image_url!,
                            info: `${formatDate(item.period_start)} - ${formatDate(item.period_end)}`,
                            officer: item.officer_name,
                            date: formatDate(item.period_end)
                          })}
                          className="p-2 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed text-blue-600 transition-all"
                          title="Lihat Foto Meteran"
                        >
                          <Camera size={20} />
                        </button>
                      )}
                      {getNotes(item) && (
                        <button
                          onClick={() => toggleNotesExpansion(String(item.bill_id))}
                          className="p-2 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed text-blue-600 transition-all"
                          title="Lihat Catatan"
                        >
                          {expandedNotesId === String(item.bill_id) ? <ChevronUp size={20} /> : <MessageSquare size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Catatan */}
                  {expandedNotesId === String(item.bill_id) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2 text-blue-800">
                      <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Catatan Petugas:</p>
                        <p className="whitespace-pre-wrap">{getNotes(item)}</p>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
        ))}
        </AnimatedList>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#e0e5ec] border-b border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <th className="text-left p-4 font-semibold text-gray-800 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Periode
                </div>
              </th>
              <th className="text-left p-4 font-semibold text-gray-800 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets size={16} />
                  Pemakaian
                </div>
              </th>
              <th className="text-right p-4 font-semibold text-gray-800 text-sm">
                <div className="flex items-center gap-2 justify-end">
                  <DollarSign size={16} />
                  Tagihan
                </div>
              </th>
              <th className="text-center p-4 font-semibold text-gray-800 text-sm">Status</th>
              <th className="text-right p-4 font-semibold text-gray-800 text-sm">
                <div className="flex items-center gap-2 justify-end">
                  <CheckCircle size={16} />
                  Dibayar
                </div>
              </th>
              <th className="text-right p-4 font-semibold text-gray-800 text-sm">
                <div className="flex items-center gap-2 justify-end">
                  <AlertTriangle size={16} />
                  Jatuh Tempo
                </div>
              </th>
              <th className="text-center p-4 font-semibold text-gray-800 text-sm">Petugas</th>
              <th className="text-center p-4 font-semibold text-gray-800 text-sm">Foto</th>
            </tr>
          </thead>
          <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {history.map((item, index) => (
              <React.Fragment key={`${item.bill_id}-${item.payment_id || index}`}>
                <motion.tr 
                  className="border-b border-gray-300/50 hover:bg-[#d1d9e6]/50 transition-colors duration-200" 
                  variants={itemVariants}
                >
                {/* Periode */}
                <td className="p-4">
                  <div className="text-sm font-medium text-gray-800">
                      {formatDate(item.period_start)} - {formatDate(item.period_end)}
                    </div>
                </td>

                {/* Pemakaian */}
                <td className="p-4">
                  <div className="text-sm font-medium text-gray-800">
                      {formatWaterUsage(item.water_usage)}
                  </div>
                    <div className="text-xs text-gray-500">
                      {formatMeterNumber(item.previous_reading)} → {formatMeterNumber(item.current_reading)}
                    </div>
                </td>

                {/* Tagihan */}
                <td className="p-4 text-right">
                  <div className="text-sm font-semibold text-gray-800">
                      {formatCurrency(Number(item.amount))}
                    </div>
                </td>

                {/* Status */}
                <td className="p-4 text-center">
                    {getStatusBadge(item.bill_status)}
                </td>

                {/* Dibayar */}
                <td className="p-4 text-right">
                  <div className={`text-sm font-medium ${
                      Number(item.paid_amount) > 0 ? 'text-green-700' : 'text-gray-500'
                  }`}>
                      {Number(item.paid_amount) > 0
                        ? formatCurrency(Number(item.paid_amount))
                      : 'Rp0'
                    }
                    </div>
                    {item.payment_date && (
                      <div className="text-xs text-gray-500">
                        {formatDate(item.payment_date)}
                    </div>
                  )}
                </td>

                  {/* Jatuh Tempo */}
                <td className="p-4 text-right">
                    <div className="text-sm font-medium text-red-700">
                      {formatDate(item.due_date)}
                    </div>
                  </td>

                  {/* Petugas */}
                  <td className="p-4 text-center">
                    <div className="text-xs text-gray-700">{item.officer_name}</div>
                  </td>


                  {/* Kolom Aksi */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.image_url && (
                        <button
                          onClick={() => setOpenImage({
                            url: item.image_url!,
                            info: `${formatDate(item.period_start)} - ${formatDate(item.period_end)}`,
                            officer: item.officer_name,
                            date: formatDate(item.period_end)
                          })}
                          title="Lihat Bukti Foto"
                          className="p-2 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed text-gray-600 transition-all"
                        >
                          <Camera size={20} />
                        </button>
                      )}
                      {getNotes(item) && (
                        <button
                          onClick={() => toggleNotesExpansion(String(item.bill_id))}
                          className="p-2 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed text-blue-600 transition-all"
                          title="Lihat Catatan"
                        >
                          {expandedNotesId === String(item.bill_id) ? <ChevronUp size={20} /> : <MessageSquare size={20} />}
                        </button>
                      )}
                      
                      {/* ✅ TOMBOL BAYAR BARU (LOGIKA DISAMAKAN) */}
                      {item.bill_status === 'unpaid' && (
                    <button
                          onClick={() => onPayBillClick(item)}
                          className="p-2 rounded-lg bg-[#e0e5ec] text-green-600 shadow-neumorph hover:shadow-neumorph-pressed transition-all"
                          title="Bayar Tagihan Ini"
                        >
                          <HandCoins size={16} />
                        </button>
                      )}
                    </div>
                </td>
                </motion.tr>

                {/* Baris Catatan */}
                {expandedNotesId === String(item.bill_id) && getNotes(item) && (
                  <tr>
                    <td colSpan={8} className="p-2 text-xs bg-blue-50 text-blue-800">
                      <span className="font-semibold">Catatan: </span>{getNotes(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Summary Footer - Konsisten dengan Admin */}
      <div className="bg-[#e0e5ec] p-4 sm:p-6 border-t border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600">Total Tagihan</div>
            <div className="font-semibold text-gray-800 text-lg">
              {formatCurrency(history.reduce((sum, item) => sum + safeCurrency(Number(item.amount) || 0), 0))}
            </div>
          </div>
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600">Total Dibayar</div>
            <div className="font-semibold text-green-600 text-lg">
              {formatCurrency(history.reduce((sum, item) => sum + safeCurrency(Number(item.paid_amount) || 0), 0))}
            </div>
          </div>
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600">Total Hutang</div>
            <div className="font-semibold text-red-600 text-lg">
              {formatCurrency(
                history.reduce((sum: number, item) => sum + getPaymentBreakdownNumber(item, 'from_debt_payment'), 0)
              )}
            </div>
          </div>
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600">Total Pemakaian</div>
            <div className="font-semibold text-blue-600 text-lg">
              {formatWaterUsage(history.reduce((sum, item) => sum + safeNumber(item.water_usage), 0))}
            </div>
          </div>
        </div>

        {/* Payment Allocation Summary */}
        {history.some(item => typeof getPaymentBreakdownNumber(item, 'from_debt_payment') === 'number' && getPaymentBreakdownNumber(item, 'from_debt_payment') > 0) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Rincian Pembayaran Total
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-red-600">Dari Hutang</div>
                <div className="font-semibold text-red-700 text-lg">
                  {formatCurrency(
                    history.reduce((sum: number, item) => sum + getPaymentBreakdownNumber(item, 'from_debt_payment'), 0)
                  )}
                </div>
              </div>
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-blue-600">Pembayaran Langsung</div>
                <div className="font-semibold text-blue-700 text-lg">
                  {formatCurrency(
                    history.reduce((sum: number, item) => sum + getPaymentBreakdownNumber(item, 'from_current_payment'), 0)
                  )}
                </div>
              </div>
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-green-600">Dari Saldo</div>
                <div className="font-semibold text-green-700 text-lg">
                  {formatCurrency(
                    history.reduce((sum: number, item) => sum + getPaymentBreakdownNumber(item, 'from_excess_balance'), 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Statistics */}
        {history.some(item => hasPaymentAllocations(item) && ((item as unknown as { paymentAllocations: unknown[] }).paymentAllocations.length > 0)) && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Receipt size={16} className="text-purple-600" />
              Statistik Pembayaran
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-gray-600">Total Transaksi</div>
                <div className="font-semibold text-gray-800 text-lg">
                  {history.reduce(
                    (sum: number, item) =>
                      sum +
                      (hasPaymentAllocations(item)
                        ? (item as unknown as { paymentAllocations: unknown[] }).paymentAllocations.length
                        : 0),
                    0
                  )}
                </div>
              </div>
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-gray-600">Tunai</div>
                <div className="font-semibold text-green-700 text-lg">
                  {paymentSummary.totalCash}
                </div>
              </div>
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-blue-600">Transfer</div>
                <div className="font-semibold text-blue-700 text-lg">
                  {paymentSummary.totalTransfer}
                </div>
              </div>
              <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <div className="text-sm text-purple-700">QRIS</div>
                <div className="font-semibold text-purple-700 text-lg">
                  {paymentSummary.totalQris}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Belum Ada Riwayat Tagihan
          </h3>
          <p className="text-gray-500">
            Riwayat tagihan akan muncul setelah ada pembacaan meter dan tagihan dibuat.
          </p>
        </div>
      )}
    </div>
  );
};

export default DetailedHistoryTable;

