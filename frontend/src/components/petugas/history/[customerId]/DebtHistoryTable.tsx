// File: DebtHistoryTable.tsx

'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Banknote,
  Calendar,
  Receipt,
  CreditCard,
  User,
  CheckCircle,
  Clock,
  TrendingUp,
  Landmark,
  HandCoins,
} from 'lucide-react';
import { DebtPayment } from '@/hooks/petugas/history/useHistoryDashboard'; // Pastikan path ini benar
import { motion } from 'framer-motion';
import { AnimatedList, itemVariants } from '@/components/common/AnimatedList';

interface DebtHistoryTableProps {
  history: DebtPayment[];
  currentDebt: number; // ✅ TAMBAHKAN PROPS BARU INI
  formatCurrency: (amount: number | string) => string;
  formatDate: (dateString: string) => string;
}

// Komponen kecil untuk menampilkan status dengan guard clause
const StatusBadge = ({ status }: { status?: string | null }) => {
  // ✅ Guard clause: Jika status tidak valid (null atau undefined), jangan render apa-apa.
  if (!status) {
    return null;
  }
  const isPaid = status.toLowerCase() === 'paid';
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${
        isPaid
          ? 'bg-green-100 text-green-800'
          : 'bg-orange-100 text-orange-800'
      }`}
    >
      {isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
      {isPaid ? 'Lunas' : 'Sebagian'}
    </span>
  );
};


export default function DebtHistoryTable({ history, currentDebt, formatCurrency, formatDate }: DebtHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggleExpand = (paymentId: number) => {
    setExpandedId(currentId => (currentId === paymentId ? null : paymentId));
  };

  // ✅ KALKULASI RINGKASAN PEMBAYARAN HUTANG
  const summary = useMemo(() => {
    // Akumulasi total pembayaran hutang
    const totalPaid = history.reduce(
      (sum, payment) => sum + parseFloat(payment.total_payment_amount || '0'),
      0
    );
    // Hutang sebelum transaksi = hutang sekarang + total pembayaran hutang
    const debtBefore = currentDebt + totalPaid;
    // Kekurangan hutang = hutang sebelum transaksi - total dibayar
    const debtRemaining = Math.max(debtBefore - totalPaid, 0);
    return { totalPaid, debtBefore, debtRemaining };
  }, [history, currentDebt]);

  if (!history || history.length === 0) return null;

  const formatPeriod = (start: string, end: string) => {
    return new Date(end).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[#e0e5ec] rounded-xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] overflow-hidden">
      {/* Header */}
      <div className="bg-[#e0e5ec] p-4 sm:p-6 border-b border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
        <div className="flex items-center gap-3">
          <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
            <Banknote className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Riwayat Pembayaran Hutang</h3>
            <p className="text-sm text-gray-600">
              {history.length} transaksi pembayaran
            </p>
          </div>
        </div>
      </div>

      {/* Tabel (desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#e0e5ec]">
            <tr className="border-b border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <th className="p-4 text-left font-semibold text-gray-700"><div className="flex items-center gap-2"><Calendar size={14} /> Tanggal Bayar</div></th>
              <th className="p-4 text-left font-semibold text-gray-700"><div className="flex items-center gap-2"><Banknote size={14} /> Total Dibayar</div></th>
              <th className="p-4 text-left font-semibold text-gray-700"><div className="flex items-center gap-2"><CreditCard size={14} /> Metode</div></th>
              <th className="p-4 text-left font-semibold text-gray-700"><div className="flex items-center gap-2"><User size={14} /> Petugas</div></th>
              <th className="p-4 text-center font-semibold text-gray-700">Rincian</th>
            </tr>
          </thead>
          <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {history.map((payment) => (
              <React.Fragment key={payment.payment_id}>
                <motion.tr className="border-b border-gray-300/50 hover:bg-[#d1d9e6]/50 transition-colors duration-200" variants={itemVariants}>
                  <td className="p-4 whitespace-nowrap">{formatDate(payment.transaction_date)}</td>
                  <td className="p-4 font-semibold text-green-700">{formatCurrency(payment.total_payment_amount)}</td>
                  <td className="p-4 capitalize">{payment.method}</td>
                  <td className="p-4">{payment.officer_name}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleExpand(payment.payment_id)} className="p-2 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed text-blue-600 transition-all" title="Lihat Rincian Alokasi">
                      {expandedId === payment.payment_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                </motion.tr>

                {/* ✅ Bagian Detail Alokasi yang Sudah Diperbarui */}
                {expandedId === payment.payment_id && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="bg-blue-50/60 p-4 mx-4 mb-4 mt-0 rounded-lg shadow-inner space-y-3">
                         <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                          <Receipt size={14} className="text-blue-600" /> Alokasi Pembayaran:
                        </h4>
                        {payment.allocations.map(alloc => (
                          <div key={alloc.bill_id} className="p-3 rounded-xl bg-[#e0e5ec] shadow-neumorph">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-300/50">
                               <div>
                                 <p className="text-xs text-gray-500">Tagihan Periode</p>
                                 <p className="font-semibold text-blue-700">{formatPeriod(alloc.bill_period_start, alloc.bill_period_end)}</p>
                               </div>
                               <StatusBadge status={alloc.final_bill_status} />
                            </div>
                            <div className="text-xs space-y-1.5 text-gray-600">
                                <div className="flex justify-between"><span>Jumlah Dialokasikan</span><span className="font-semibold text-green-600">{formatCurrency(alloc.allocated_amount)}</span></div>
                                <div className="flex justify-between"><span>Total Tagihan Asli</span><span className="font-medium">{formatCurrency(alloc.bill_total_amount)}</span></div>
                                <div className="flex justify-between"><span>ID Tagihan</span><span className="font-mono text-gray-500">{alloc.bill_id}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* ✅ Tampilan Mobile yang Sudah Diperbarui */}
      <div className="block md:hidden">
        <AnimatedList className="divide-y divide-gray-200">
        {history.map((payment) => (
            <motion.div key={payment.payment_id} className="p-4" variants={itemVariants}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-semibold text-gray-800">{formatDate(payment.transaction_date)}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-1"><User size={12}/> {payment.officer_name}</div>
              </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">{formatCurrency(payment.total_payment_amount)}</div>
                  <div className="text-xs capitalize text-gray-500">{payment.method}</div>
              </div>
              </div>
              <button onClick={() => toggleExpand(payment.payment_id)} className="mt-2 w-full text-sm flex justify-center items-center gap-1 text-blue-600 hover:text-blue-800">
                {expandedId === payment.payment_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expandedId === payment.payment_id ? 'Sembunyikan Alokasi' : 'Lihat Rincian Alokasi'}
              </button>

            {expandedId === payment.payment_id && (
                <div className="mt-3 bg-blue-50/60 p-3 rounded-lg shadow-inner space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2"><Receipt size={14} className="text-blue-600" /> Alokasi:</h4>
                  {payment.allocations.map(alloc => (
                      <div key={alloc.bill_id} className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
                           <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-300/50">
                               <div>
                                 <p className="text-xs text-gray-500">Tagihan Periode</p>
                                 <p className="font-semibold text-blue-700">{formatPeriod(alloc.bill_period_start, alloc.bill_period_end)}</p>
                               </div>
                               <StatusBadge status={alloc.final_bill_status} />
                            </div>
                            <div className="text-xs space-y-1.5 text-gray-600">
                                <div className="flex justify-between"><span>Dialokasikan</span><span className="font-semibold text-green-600">{formatCurrency(alloc.allocated_amount)}</span></div>
                                <div className="flex justify-between"><span>Tagihan Asli</span><span className="font-medium">{formatCurrency(alloc.bill_total_amount)}</span></div>
                            </div>
                      </div>
                  ))}
              </div>
            )}
            </motion.div>
        ))}
        </AnimatedList>
      </div>

      {/* ✅ TAMBAHKAN BLOK JSX INI DI BAGIAN BAWAH */}
      <div className="bg-[#e0e5ec] p-4 sm:p-6 border-t border-gray-200 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />
          Ringkasan Pembayaran Hutang
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Kartu Total Pembayaran Hutang */}
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <HandCoins size={14}/> Total Pembayaran (di daftar ini)
            </div>
            <div className="font-semibold text-green-600 text-lg">
              {formatCurrency(summary.totalPaid)}
            </div>
          </div>
          
          {/* Kartu Hutang Saat Ini */}
          <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Landmark size={12} /> Hutang Saat Ini
            </div>
            <div className="font-semibold text-red-600 text-lg">
              {formatCurrency(currentDebt)}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}