'use client';

import React, { useMemo } from 'react';
import { DetailedHistory, CustomerFinancialSummary } from '@/hooks/petugas/history/useHistoryDashboard';
import {
  TrendingUp,
  HandCoins
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedList, itemVariants } from '@/components/common/AnimatedList';

// Fungsi helper dengan tipe yang lebih aman
const safeSum = (arr: (string | number)[]): number => {
  return arr.reduce((acc: number, val) => acc + (Number(val) || 0), 0);
};

const safeAverage = (arr: (string | number)[]): number => {
  if (arr.length === 0) return 0;
  const sum = safeSum(arr);
  return sum / arr.length;
};

interface BillingPaymentInfoProps {
  history: DetailedHistory[];
  financialSummary: CustomerFinancialSummary;
  formatCurrency: (amount: number | string) => string;
  formatDate: (dateString: string) => string;
  onPayDebtClick: () => void;
}

const BillingPaymentInfo: React.FC<BillingPaymentInfoProps> = ({
  history = [],
  financialSummary,
  formatCurrency,
  onPayDebtClick
}) => {

  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        averageWaterUsage: 0,
        averageBillAmount: 0,
        trend: 0,
      };
    }
    
    const waterUsageValues = history.map(item => item.water_usage);
    const billAmountValues = history.map(item => item.amount);

  const averageWaterUsage = safeAverage(waterUsageValues);
  const averageBillAmount = safeAverage(billAmountValues);

    let trend = 0;
    if (history.length >= 3) {
      const lastMonthUsage = Number(history[0].water_usage);
      const thirdLastMonthUsage = Number(history[2].water_usage);
      if (lastMonthUsage > thirdLastMonthUsage) trend = 1;
      if (lastMonthUsage < thirdLastMonthUsage) trend = -1;
    }

    return { averageWaterUsage, averageBillAmount, trend };
  }, [history]);

  return (
    <AnimatedList className="space-y-6">
      {financialSummary.hutang > 0 && (
        <motion.div variants={itemVariants}>
          <div className="bg-[#e0e5ec] p-5 rounded-2xl shadow-neumorph">
            <button 
              onClick={onPayDebtClick}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-neumorph hover:bg-red-600 transition-all flex items-center justify-center gap-2"
            >
              <HandCoins size={18} />
              Bayar Tunggakan
            </button>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="bg-[#e0e5ec] rounded-2xl p-5 shadow-neumorph">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={22} className="text-blue-600" />
            Analisis Pemakaian
        </h3>

          {history.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/60 p-3 rounded-lg shadow-neumorph-inset">
                <div className="text-xs text-gray-600">Pemakaian Terakhir</div>
                <div className="font-bold text-blue-700 text-lg">
                  {Number(history[0].water_usage).toFixed(2)} <span className="text-sm">m³</span>
                    </div>
                  </div>
              <div className="bg-white/60 p-3 rounded-lg shadow-neumorph-inset">
                <div className="text-xs text-gray-600">Rata-rata Pemakaian</div>
                <div className="font-bold text-purple-700 text-lg">
                  {stats.averageWaterUsage.toFixed(2)} <span className="text-sm">m³</span>
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-lg shadow-neumorph-inset col-span-2 md:col-span-1">
                <div className="text-xs text-gray-600">Rata-rata Tagihan</div>
                <div className="font-bold text-green-700 text-lg">{formatCurrency(stats.averageBillAmount)}</div>
        </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada data riwayat pemakaian yang cukup untuk dianalisis.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 
        PERBAIKAN: Blok ini dikomentari karena properti 'earliestDueDate' tidak ada pada tipe CustomerFinancialSummary.
        Untuk mengaktifkannya kembali, tambahkan `earliestDueDate?: string;` pada tipe CustomerFinancialSummary di hook `useHistoryDashboard`.
      */}
      {/*
      {financialSummary.earliestDueDate && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-100/70 shadow-neumorph">
          <div className="bg-yellow-500 p-2 rounded-full">
            <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
            <p className="font-semibold text-yellow-800">Perhatian: Jatuh Tempo Terdekat</p>
            <p className="text-sm text-yellow-700 mt-1">
              {formatDate(financialSummary.earliestDueDate)} - Segera lakukan pembayaran.
            </p>
          </div>
        </div>
      )}
      */}
    </AnimatedList>
  );
};

export default BillingPaymentInfo;