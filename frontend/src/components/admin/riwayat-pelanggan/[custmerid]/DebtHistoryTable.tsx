'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import type { DebtHistoryItem } from '@/hooks/admin/history/useAdminCustomerHistory';

interface DebtHistoryTableProps {
  debtHistory: DebtHistoryItem[];
  formatDate: (dateString: string) => string;
  onViewDetails: (paymentId: number) => void;
}

export default function DebtHistoryTable({ debtHistory, formatDate, onViewDetails }: DebtHistoryTableProps) {
  // Jika tidak ada riwayat pembayaran hutang, jangan tampilkan apapun
  if (!debtHistory || debtHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">Riwayat Pembayaran Hutang</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#e0e5ec]">
          <thead className="bg-[#d1d5dc]">
            <tr className="text-gray-700 text-sm">
              <th className="py-3 px-4 text-left font-semibold w-1/4">Tgl Bayar</th>
              <th className="py-3 px-4 text-left font-semibold w-1/4">Jumlah</th>
              <th className="py-3 px-4 text-left font-semibold w-1/4">Metode</th>
              <th className="py-3 px-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c5c9d1]">
            {debtHistory.map((item) => (
              <tr key={item.payment_id} className="hover:bg-[#d1d5dc]/60 transition-colors duration-200 text-sm">
                <td className="py-3 px-4 text-gray-700 font-medium">
                  {formatDate(item.transaction_date)}
                </td>
                <td className="py-3 px-4 font-medium text-green-600">
                  {formatRupiah(item.total_payment_amount)}
                </td>
                <td className="py-3 px-4 text-gray-700 capitalize">
                  {item.method}
                </td>
                <td className="py-2 px-4 text-center align-middle">
                  <div className="flex justify-center items-center h-full">
                    <button
                      onClick={() => onViewDetails(item.payment_id)}
                      className="py-2 px-3 rounded-lg bg-blue-500 text-white shadow-neumorph hover:bg-blue-600 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title="Lihat Detail Alokasi Pembayaran"
                    >
                      <Eye size={16} />
                      <span>Detail</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}