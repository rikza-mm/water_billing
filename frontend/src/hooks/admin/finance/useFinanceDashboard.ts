"use client";

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { useAdminCustomerHistory } from '@/hooks/admin/history/useAdminCustomerHistory';

// =======================================================================
// INTERFACES (Sesuai dengan backend financialModel.js)
// =======================================================================

// ✅ PERBAIKAN: Interface sesuai dengan struktur backend yang baru
export interface IncomeStatement {
  pendapatan_penjualan: number;
  total_hpp: number;
  laba_kotor: number;
  total_biaya_operasional: number;
  laba_operasional: number;
  pendapatan_lain: number;
  biaya_lain: number;
  laba_sebelum_pajak: number;
  pajak_usaha: number;
  laba_bersih_sebelum_prive: number;
  prive_pemilik: number;
  laba_bersih_setelah_prive: number;
}

export interface CashFlowStatement {
  summary: Array<{
    cashflow_classification: 'OPERATING' | 'INVESTING' | 'FINANCING';
    total_inflow: string;
    total_outflow: string;
  }>;
  details: Array<{
    cashflow_classification: string;
    type: 'income' | 'expense';
    category: string;
    total_amount: string;
    transaction_count: string;
  }>;
}

export interface BalanceSheet {
  periode: string;
  aset: {
    aset_lancar: {
      kas_dan_bank: string;
      piutang_usaha: string;
    };
    aset_tetap: {
      peralatan_dan_inventaris: string;
    };
    total_aset: string;
  };
  kewajiban_dan_ekuitas: {
    kewajiban: {
      total_kewajiban: string;
    };
    ekuitas: {
      modal_akhir: string;
    };
    total_kewajiban_dan_ekuitas: number;
  };
  status: 'SEIMBANG' | 'TIDAK SEIMBANG';
  debug_info?: {
    kas_calculation: string;
    difference: string;
    [key: string]: string | number | boolean;
  };
}

export interface EquityTransaction {
  id: number;
  transaction_date: string;
  type: 'MODAL_AWAL' | 'SETORAN_MODAL' | 'PRIVE' | 'LABA_DITAHAN_PERIODIK';
  amount: number;
  description: string;
  created_by: number;
  created_at: string;
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
  transactions: number;
}

// Interface untuk FinancialRecord sesuai dengan getFinancialRecords di backend
export interface FinancialRecord {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  cashflow_classification?: 'OPERATING' | 'INVESTING' | 'FINANCING';
  date: string;
  notes?: string;
  created_by: number;
  created_at: string;
  payment_id?: number;
  customer_name?: string;
  payment_method?: string;
}

// Interface untuk CustomerBalance sesuai dengan getCustomerBalances di backend
export interface CustomerBalance {
  customer_id: number;
  customer_name: string;
  current_balance: number;
  current_debt: number;
  total_payments: number;
  last_payment_date: string;
}

// ✅ PERBAIKAN: Interface untuk dashboard data response
export interface DashboardData {
  incomeStatement: IncomeStatement;
  cashFlowStatement: CashFlowStatement;
  balanceSheet: BalanceSheet;
  equityTransactions: EquityTransaction[];
  recentFinancials: FinancialRecord[];
  dailyOverview: DailyData[]; // <-- TAMBAHKAN: Interface untuk data grafik
  validation?: {
    checks: {
      balance_sheet_equation: {
        status: string;
        difference: number;
        passed: boolean;
      };
      cash_calculation: {
        balance_sheet_cash: number;
        detailed_calculation_cash: number;
        difference: number;
        passed: boolean;
      };
    };
    recommendations: Array<{
      type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
      message: string;
      action: string;
    }>;
  };
}

// Interface untuk CashFlowStatement sesuai dengan getCashFlowStatementData di backend
export interface CashFlowStatement {
  periode: { start: string; end: string };
  saldo_kas_awal: number;
  saldo_kas_akhir: number;
  aktivitas_operasional: {
    arus_masuk: number;
    arus_keluar: number;
    arus_kas_bersih: number;
    detail: Array<{
      category: string;
      type: 'income' | 'expense';
      total_amount: number;
      transaction_count: number;
    }>;
  };
  aktivitas_investasi: {
    arus_masuk: number;
    arus_keluar: number;
    arus_kas_bersih: number;
    detail: Array<{
      category: string;
      type: 'income' | 'expense';
      total_amount: number;
      transaction_count: number;
    }>;
  };
  aktivitas_pendanaan: {
    arus_masuk: number;
    arus_keluar: number;
    arus_kas_bersih: number;
    detail: Array<{
      category: string;
      type: 'income' | 'expense';
      total_amount: number;
      transaction_count: number;
    }>;
  };
  ringkasan: {
    total_arus_kas_bersih: number;
    perubahan_kas: number;
    verifikasi_saldo: number;
  };
}

// Interface untuk props hook
export interface UseFinanceDashboardProps {
  dateRange: {
    start: string;
    end: string;
  };
  filterType?: string;
  filterCategory?: string;
  searchTerm?: string;
}

// =======================================================================
// HOOK UTAMA - Menggunakan satu hook untuk semua kebutuhan finance
// =======================================================================

export function useFinanceDashboard(props: UseFinanceDashboardProps) {
  const { dateRange } = props;

  // ✅ PERBAIKAN: State sesuai dengan struktur backend baru
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { customerList, fetchCustomerList } = useAdminCustomerHistory();

  // ✅ PERBAIKAN: Fungsi fetch menggunakan endpoint baru
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ PERBAIKAN: Tambahkan null check untuk dateRange
      if (!dateRange?.start || !dateRange?.end) {
        throw new Error('Tanggal awal dan akhir diperlukan');
      }

      const response = await api.post('/admin/finance/dashboard-data', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.data.message || 'Gagal memuat data dashboard');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data dashboard';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange?.start, dateRange?.end]); // ✅ PERBAIKAN: Gunakan optional chaining

  // Ganti nama `fetchCustomerBalances` menjadi lebih jelas
  const fetchInitialData = useCallback(async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchCustomerList()
    ]);
  }, [fetchDashboardData, fetchCustomerList]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, dateRange.start, dateRange.end]);

  // ✅ PERBAIKAN: Fungsi untuk aksi menggunakan endpoint yang benar
  const addTransaction = useCallback(async (data: {
    type: 'income' | 'expense';
    amount: string;
    description: string;
    date: string;
    category: string;
    cashflow_classification?: 'OPERATING' | 'INVESTING' | 'FINANCING';
    notes?: string;
    asset_name?: string; // Untuk transaksi investasi
  }) => {
    try {
      setIsLoading(true);
      const response = await api.post('/admin/finance/transactions', data);
      if (response.data.success) {
        await fetchInitialData();
        return { success: true, message: 'Transaksi berhasil ditambahkan' };
      } else {
        throw new Error(response.data.message || 'Gagal menambahkan transaksi');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan transaksi';
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchInitialData]);

  const addEquityTransaction = useCallback(async (data: {
    transaction_date: string;
    type: 'MODAL_AWAL' | 'SETORAN_MODAL' | 'PRIVE';
    amount: string;
    description: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await api.post('/admin/finance/equity-transactions', data);
      if (response.data.success) {
        await fetchInitialData();
      } else {
        throw new Error(response.data.message || 'Gagal menambahkan transaksi modal');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan transaksi modal';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInitialData]);

  const closePeriod = useCallback(async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/admin/finance/close-period', {
        start_date: startDate,
        end_date: endDate
      });
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menutup periode karena masalah jaringan.';
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchInitialData]);


  // ✅ PERBAIKAN: Return value sesuai dengan struktur data baru
  return {
    // Data utama dari dashboard
    dashboardData,

    // Data individual untuk backward compatibility
    incomeStatement: dashboardData?.incomeStatement || null,
    cashFlowStatement: dashboardData?.cashFlowStatement || null,
    balanceSheet: dashboardData?.balanceSheet || null,
    equityTransactions: dashboardData?.equityTransactions || [],
    recentFinancials: dashboardData?.recentFinancials || [],
    dailyOverview: dashboardData?.dailyOverview || [], // <-- TAMBAHKAN: Sediakan data grafik

    // Data tambahan
    customerBalances: customerList, // <-- Langsung gunakan `customerList`

    // Validation info
    validation: dashboardData?.validation || null,

    // Status
    isLoading,
    error,
    lastUpdated,

    // Functions
    fetchInitialData,
    addTransaction,
    addEquityTransaction,
    closePeriod
  };
}