"use client";

import { useState, useCallback, useEffect } from 'react';
import  api  from '@/lib/axios';

// =======================================================================
// INTERFACES (Matching the backend response)
// =======================================================================

export interface OverallSummary {
  total_pelanggan_aktif: number;
  pelanggan_menunggak: string;
  total_tunggakan: string;
  pelanggan_bersaldo: string;
  total_saldo_pelanggan: string;
  customerStatusComposition: {
    normal: string;
    inDebt: string;
    hasBalance: string;
  };
  total_pendapatan_terkumpul: string;
  total_tagihan_terbit: string;
  collection_rate: number;
}

export interface OfficerLeaderboardEntry {
  officer_id: number;
  officer_name: string;
  total_revenue: string;
  total_transactions: number;
  unique_customers_served: number;
  handled_areas: string;
}

export interface AreaPerformanceEntry {
  area_name: string;
  total_revenue: string;
  total_tunggakan: string;
  jumlah_pelanggan_menunggak: number;
}

export interface CustomerActionEntry {
  customer_id: number;
  full_name: string;
  area_name: string;
  officer_in_charge: string;
  hutang?: string;
  unpaid_bills_count?: number;
  oldest_due_date?: string;
  current_reading?: string;
  reading_date?: string;
}

export interface CustomerActionLists {
  topDefaulters: CustomerActionEntry[];
  longestOverdueCustomers: CustomerActionEntry[];
  zeroUsageCustomers: CustomerActionEntry[];
  notBilledCustomers: CustomerActionEntry[];
}

export interface AnalystDashboardData {
  overallSummary: OverallSummary;
  officerLeaderboard: OfficerLeaderboardEntry[];
  areaPerformance: AreaPerformanceEntry[];
  customerActionLists: CustomerActionLists;
}

export interface UseAnalystDashboardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

export interface OfficerDetailData {
  kpi: {
    full_name: string;
    handled_areas: string;
    total_transactions: number;
    total_revenue: string;
    unique_customers_served: number;
  };
  revenueTrend: { date: string; daily_revenue: string; }[];
  revenueByArea: { area_name: string; total_revenue: string; }[];
  transactionHistory: {
    transaction_date: string;
    customer_name: string;
    area_name: string;
    amount: string;
    method: string;
  }[];
}

export interface CustomerLedgerData {
  summary: {
    full_name: string;
    address: string;
    area_name: string;
    category_name: string;
    meter_number: string;
    officer_in_charge: string;
    hutang: string;
    saldo: string;
    status: string;
  };
  ledger: {
    event_date: string;
    event_type: 'PENDAFTARAN' | 'TAGIHAN' | 'PEMBAYARAN';
    description: string;
    debit: string;
    credit: string;
  }[];
}

// =======================================================================
// THE HOOK
// =======================================================================

export function useAnalystDashboard({ dateRange }: UseAnalystDashboardProps) {
  const [data, setData] = useState<AnalystDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/admin/analyst/dashboard', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data analis.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // =======================================================================
  // FUNGSI BARU UNTUK MENGAMBIL DATA DETAIL
  // =======================================================================

  const fetchOfficerDetail = useCallback(async (officerId: number) => {
    // Fungsi ini akan dipanggil dari halaman detail petugas
    // Ia mengembalikan data mentah, state loading/error dikelola di halaman detail
    const response = await api.post(`/admin/analyst/officer-detail/${officerId}`, {
      start_date: dateRange.start,
      end_date: dateRange.end,
    });
    if (response.data.success) {
      return response.data.data as OfficerDetailData;
    } else {
      throw new Error(response.data.message || 'Gagal memuat detail petugas.');
    }
  }, [dateRange.start, dateRange.end]);


  const fetchCustomerLedger = useCallback(async (customerId: number) => {
    // Fungsi ini akan dipanggil dari halaman detail pelanggan
    const response = await api.get(`/admin/analyst/customer-ledger/${customerId}`);
    if (response.data.success) {
      return response.data.data as CustomerLedgerData;
    } else {
      throw new Error(response.data.message || 'Gagal memuat detail pelanggan.');
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData,
    fetchOfficerDetail,
    fetchCustomerLedger,
  };
}