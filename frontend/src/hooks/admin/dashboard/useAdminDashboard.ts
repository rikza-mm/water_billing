"use client";

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

// =======================================================================
// INTERFACES (Sesuai dengan struktur respons backend)
// =======================================================================

export interface AdminDashboardSummary {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalUnpaidBills: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  incomeToday?: number; // Opsional
  incomeThisWeek?: number; // Opsional
}

export interface IncomeExpenseTrend {
  month: string;
  pemasukan: string;
  pengeluaran: string;
}

export interface OverdueCustomer {
  name: string;
  phone_number: string;
  amount: string;
}

export interface Notification {
  message: string;
  time: string;
}

export interface CustomersByArea {
  wilayah: string;
  jumlah: number;
}

export interface OfficerActivity {
  totalPetugasAktif: number;
  pembayaranHariIni: number;
  pembacaanMeterHariIni: number;
  pendapatanPetugasBulanIni: string;
}

export interface AdminDashboardData {
  summary: AdminDashboardSummary;
  incomeExpenseTrend: IncomeExpenseTrend[];
  overdueCustomers: OverdueCustomer[];
  notifications: Notification[];
  customersByArea: CustomersByArea[];
  officerActivity: OfficerActivity;
}

// =======================================================================
// THE HOOK
// =======================================================================

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Panggil endpoint GET yang sudah dibuat
      const response = await api.get('/admin/dashboard/summary');

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data dasbor.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData
  };
}