import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

// Interface untuk kartu pendapatan utama
interface RevenueCard {
  currentMonthRevenue: number;
  percentageChange: number;
  changeType: 'increase' | 'decrease' | 'nochange';
}

// ✅ INTERFACE DIPERBARUI: Tambahkan semua 10 metrik statistik
export interface KpiCards {
  totalCustomers: number;
  totalUsageThisMonth: number;
  paidTransactionsThisMonth: number;
  totalUnpaidBills: number;
  customersWithDebt: number;
  customersNotBilledThisMonth: number;
  customersWithOverdueBills: number;
  totalDebt: number;
  totalBillsThisMonth: number;
  totalPaymentsThisMonth: number;
}

// Interface untuk data grafik
interface RevenueChart {
  labels: string[];
  series: { name: string; data: number[] }[];
  summary: {
    totalRevenue: number;
    monthlyAverage: number;
  };
}

export function usePetugasDashboard() {
  const [loading, setLoading] = useState(true);
  const [revenueCard, setRevenueCard] = useState<RevenueCard>({
    currentMonthRevenue: 0,
    percentageChange: 0,
    changeType: 'nochange',
  });

  // ✅ STATE AWAL DIPERBARUI: Tambahkan nilai default untuk metrik baru
  const [kpiCards, setKpiCards] = useState<KpiCards>({
    totalCustomers: 0,
    totalUsageThisMonth: 0,
    paidTransactionsThisMonth: 0,
    totalUnpaidBills: 0,
    customersWithDebt: 0,
    customersNotBilledThisMonth: 0,
    customersWithOverdueBills: 0,
    totalDebt: 0,
    totalBillsThisMonth: 0,
    totalPaymentsThisMonth: 0,
  });

  const [revenueChart, setRevenueChart] = useState<RevenueChart>({
    labels: [],
    series: [{ name: 'Pendapatan', data: [] }],
    summary: { totalRevenue: 0, monthlyAverage: 0 },
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/petugas/dashboard/');
      if (res.data.success && res.data.data) {
        // Data dari API kini akan mengisi state yang sudah diperbarui
        setRevenueCard(res.data.data.revenueCard);
        setKpiCards(res.data.data.kpiCards);
        setRevenueChart(res.data.data.revenueChart);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    revenueCard,
    kpiCards,
    revenueChart,
    refreshData: fetchDashboardData,
  };
}
