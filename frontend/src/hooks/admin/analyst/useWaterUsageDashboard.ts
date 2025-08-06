"use client";

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

// =======================================================================
// INTERFACES (Sesuai dengan struktur respons backend)
// =======================================================================

export interface UsageSummary {
  totalUsageM3: string;
  activeCustomers: number;
  totalRevenue: string;
  avgUsagePerCustomer: number;
  revenuePerM3: number;
  topConsumer: {
    customer_id: number;
    full_name: string;
    usage_m3: string;
  };
}

export interface MonthlyUsageTrend {
  month: string;
  totalUsageM3: string;
}

export interface UsageByArea {
  area_name: string;
  totalUsageM3: string;
  customerCount: number;
  totalRevenue: string;
  avgUsagePerCustomer: number;
}

export interface CustomerUsageEntry {
  customer_id: number;
  full_name: string;
  area_name: string;
  waterUsageM3: string;
  lastBillAmount: string;
}

export interface CustomerUsageAnalysis {
  topUsageCustomers: CustomerUsageEntry[];
  lowUsageCustomers: CustomerUsageEntry[];
}

export interface WaterUsageDashboardData {
  usageSummary: UsageSummary;
  monthlyUsageTrend: MonthlyUsageTrend[];
  usageByArea: UsageByArea[];
  customerUsageAnalysis: CustomerUsageAnalysis;
}

export interface UseWaterUsageDashboardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

// =======================================================================
// THE HOOK
// =======================================================================

export function useWaterUsageDashboard({ dateRange }: UseWaterUsageDashboardProps) {
  const [data, setData] = useState<WaterUsageDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/admin/water-usage', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data pemakaian air.');
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

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData
  };
}