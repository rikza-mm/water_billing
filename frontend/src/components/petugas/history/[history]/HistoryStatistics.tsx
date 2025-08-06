'use client';

import React from 'react';
import { FileText, Banknote, AlertTriangle, Wallet } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { HistorySummary } from '@/hooks/petugas/history/useHistoryDashboard';

interface HistoryStatisticsProps {
  summary: HistorySummary | null;
}

const StatCard = ({ icon, label, value, colorClass }: { icon: React.ReactNode, label: string, value: string, colorClass: string }) => (
  <div className="bg-[#e0e5ec] p-3 sm:p-4 rounded-xl shadow-neumorph flex items-center gap-3 sm:gap-4">
    <div className={`p-2 sm:p-3 rounded-full shadow-neumorph-sm bg-white/50 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs sm:text-sm text-gray-600">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default function HistoryStatistics({ summary }: HistoryStatisticsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#e0e5ec] p-4 rounded-xl shadow-neumorph h-[80px] sm:h-[88px] animate-pulse">
             <div className="h-3 sm:h-4 bg-gray-300/50 rounded w-3/4 mb-2"></div>
             <div className="h-5 sm:h-6 bg-gray-300/50 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <StatCard 
        icon={<FileText size={20} />} 
        label="Total Pembacaan" 
        value={summary.totalReadings?.toLocaleString('id-ID') || '0'}
        colorClass="text-purple-600"
      />
      <StatCard 
        icon={<AlertTriangle size={20} />} 
        label="Pelanggan Belum Bayar" 
        value={summary.totalUnpaidCustomers?.toLocaleString('id-ID') || '0'}
        colorClass="text-red-600"
      />
       <StatCard 
        icon={<Wallet size={20} />} 
        label="Pelanggan Bersaldo" 
        value={summary.customersWithBalance?.toLocaleString('id-ID') || '0'}
        colorClass="text-green-600"
      />
      <StatCard 
        icon={<Banknote size={20} />} 
        label="Total Belum Dibayar" 
        value={formatRupiah(summary.totalUnpaidAmount || 0)}
        colorClass="text-orange-600"
      />
    </div>
  );
}