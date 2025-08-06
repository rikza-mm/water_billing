'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Droplets, Receipt, FileWarning, UserX, UserCheck, } from 'lucide-react';
import { KpiCards } from '@/hooks/petugas/dashboard/usePetugasDashboard';

interface RevenueStatsProps {
  revenueCard: {
    currentMonthRevenue: number;
    percentageChange: number;
    changeType: 'increase' | 'decrease';
  };
  kpiCards: KpiCards;
}

export default function RevenueStats({ revenueCard, kpiCards }: RevenueStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };
  
  const isPositiveGrowth = revenueCard.changeType === 'increase';

  return (
    <div className="space-y-6">
      {/* Main Revenue Card */}
      <div className="bg-[#e0e5ec] rounded-2xl p-6 shadow-neumorph">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-gray-600 text-sm font-medium mb-1">Total Pendapatan Bulan Ini</h2>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(revenueCard.currentMonthRevenue)}
            </p>
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full ${isPositiveGrowth ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isPositiveGrowth ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            <span className="text-sm font-medium">{Math.abs(revenueCard.percentageChange)}%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-blue-100 w-fit mb-3"><Users size={20} className="text-blue-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.totalCustomers}</p>
          <p className="text-sm text-gray-600 mt-1">Total Pelanggan</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-cyan-100 w-fit mb-3"><Droplets size={20} className="text-cyan-600" /></div>
          <p className="text-xl font-bold text-gray-800">{Math.round(kpiCards.totalUsageThisMonth)} m³</p>
          <p className="text-sm text-gray-600 mt-1">Pemakaian Bulan Ini</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-green-100 w-fit mb-3"><Receipt size={20} className="text-green-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.paidTransactionsThisMonth}</p>
          <p className="text-sm text-gray-600 mt-1">Transaksi Lunas (Bulan Ini)</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-yellow-100 w-fit mb-3"><FileWarning size={20} className="text-yellow-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.totalUnpaidBills}</p>
          <p className="text-sm text-gray-600 mt-1">Belum Lunas (Bulan Ini)</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-red-100 w-fit mb-3"><UserCheck size={20} className="text-red-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.customersWithDebt}</p>
          <p className="text-sm text-gray-600 mt-1">Pelanggan Punya Hutang</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-gray-100 w-fit mb-3"><UserX size={20} className="text-gray-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.customersNotBilledThisMonth}</p>
          <p className="text-sm text-gray-600 mt-1">Belum Tercatat Bulan Ini</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-red-100 w-fit mb-3"><DollarSign size={20} className="text-red-600" /></div>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(kpiCards.totalDebt)}</p>
          <p className="text-sm text-gray-600 mt-1">Total Nominal Hutang</p>
        </div>
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="p-2 rounded-lg bg-blue-100 w-fit mb-3"><Receipt size={20} className="text-blue-600" /></div>
          <p className="text-xl font-bold text-gray-800">{kpiCards.totalBillsThisMonth}</p>
          <p className="text-sm text-gray-600 mt-1">Tagihan Diterbitkan (Bulan Ini)</p>
        </div>
      </div>
    </div>
  );
}