import { useState, useCallback, useRef } from 'react';
import axios from '@/lib/axios';
import { useAreaRestriction, handleApiAreaError } from '@/hooks/useAreaRestriction';
import { toast } from 'react-hot-toast';

// ===== DEFINISI INTERFACE YANG JELAS DAN BENAR =====
export interface DetailedHistory {
  bill_id: number;
  period_start: string;
  period_end: string;
  amount: string;
  paid_amount: string;
  bill_status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  reading_id: number;
  current_reading: string;
  previous_reading: string;
  water_usage: string;
  reading_date: string;
  image_url: string | null;
  officer_name: string;
  payment_id?: number;
  payment_amount?: string;
  payment_method?: string;
  payment_date?: string;
}

export interface Allocation {
  allocation_id: number;
  bill_id: number;
  allocated_amount: number; // Pastikan menggunakan nama ini
  bill_period_start: string;
  bill_period_end: string;
  bill_total_amount: number;
  final_bill_status: 'paid' | 'partial' | 'unpaid';
}

export interface DebtPayment {
  payment_id: number;
  total_payment_amount: string;
  method: string;
  transaction_date: string;
  officer_name: string;
  allocations: Allocation[];
}

export interface CustomerFinancialSummary {
  customerName: string;
  address: string;
  phone: string;
  meterNumber: string;
  saldo: number;
  hutang: number;
  area: string;
}

export interface CustomerHistory {
  id: string;
  name: string;
  address: string;
  area: string;
  phoneNumber: string;
  lastReading: number;
  lastReadingDate: string;
  totalUsage: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  averageUsage: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  lastPaymentDate?: string;
  lastPaymentMethod?: string;
  officerName?: string;
  notes?: string;
  saldo?: number;
  hutang?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  meterNumber?: string;
  connectionDate?: string;
  customerType?: string;
  status?: 'active' | 'inactive' | 'suspended';
  lastBillAmount?: number;
  overdueMonths?: number;
  averageMonthlyBill?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface HistoryFilter {
  customerId?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: 'all' | 'paid' | 'unpaid';
  area?: string;
  period?: string;
}

export interface HistorySummary {
  totalReadings: number;
  totalUnpaidCustomers: number;
  averageDelay: number;
  problematicCustomers: number;
  totalUnpaidAmount?: number;
  currentMonthReadings: number;
  totalOutstandingDebt: number;
  totalOverdueAmount: number;
  averageMonthlyRevenue: number;
  collectionRate: number;
  activeCustomers: number;
  suspendedCustomers: number;
  customersWithBalance?: number;
  newConnectionsThisMonth: number;
  highUsageCustomers: number;
  zeroUsageCustomers: number;
  totalAreasServed: number;
  averageReadingsPerDay: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  filter: HistoryFilter;
  includeDetails: boolean;
}

// ✅ TAMBAHKAN INTERFACE UNTUK RESPON API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Helper type guard for error with response.data.message
function isApiErrorWithMessage(err: unknown): err is { response: { data: { message: string } } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object' &&
    (err as { response?: unknown }).response !== null &&
    'data' in (err as { response: { data?: unknown } }).response &&
    typeof (err as { response: { data?: unknown } }).response.data === 'object' &&
    (err as { response: { data: { message?: unknown } } }).response.data !== null &&
    'message' in (err as { response: { data: { message?: unknown } } }).response.data &&
    typeof (err as { response: { data: { message?: unknown } } }).response.data.message === 'string'
  );
}

export function useHistoryDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] = useState<CustomerHistory[]>([]);
  const [detailedHistory, setDetailedHistory] = useState<DetailedHistory[]>([]);
  // ✅ PASTIKAN STATE DEBTHISTORY DITETAPKAN TIPENYA DENGAN BENAR
  const [debtHistory, setDebtHistory] = useState<DebtPayment[]>([]);
  const [customerFinancialSummary, setCustomerFinancialSummary] = useState<CustomerFinancialSummary | null>(null);
  const [summary, setSummary] = useState<HistorySummary>({
    totalReadings: 0,
    totalUnpaidCustomers: 0,
    averageDelay: 0,
    problematicCustomers: 0,
    totalUnpaidAmount: 0,
    currentMonthReadings: 0,
    totalOutstandingDebt: 0,
    totalOverdueAmount: 0,
    averageMonthlyRevenue: 0,
    collectionRate: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    customersWithBalance: 0,
    newConnectionsThisMonth: 0,
    highUsageCustomers: 0,
    zeroUsageCustomers: 0,
    totalAreasServed: 0,
    averageReadingsPerDay: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const areaRestriction = useAreaRestriction();
  const areaRestrictionRef = useRef(areaRestriction);
  areaRestrictionRef.current = areaRestriction;

  const handleApiError = useCallback((err: unknown) => {
    if (!handleApiAreaError(err, areaRestrictionRef.current)) {
      let errorMessage = 'Terjadi kesalahan';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        errorMessage = (err as { message?: string }).message ?? errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const fetchHistories = useCallback(async (filter: HistoryFilter = {}, page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filter.customerId) params.append('customerId', filter.customerId);
      if (filter.customerName) params.append('customerName', filter.customerName);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.paymentStatus && filter.paymentStatus !== 'all') {
        params.append('paymentStatus', filter.paymentStatus);
      }
      if (filter.area) params.append('area', filter.area);
      if (filter.period) params.append('period', filter.period);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await axios.get(`/petugas/history?${params.toString()}`);
      if (response.data.success) {
        setHistories(response.data.data.histories || []);
        setPagination(response.data.data.pagination);
        setSummary(response.data.data.summary);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data riwayat');
      }
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchDetailedHistory = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/petugas/history/customer/${customerId}/detailed`);
      if (response.data.success) {
        setDetailedHistory(response.data.data.history || []);
        setCustomerFinancialSummary(response.data.data.summary || null);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil riwayat tagihan.');
      }
    } catch (err: unknown) {
      let errorMsg = 'Gagal mengambil riwayat tagihan.';
      if (isApiErrorWithMessage(err)) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDebtHistory = useCallback(async (customerId: string) => {
    try {
      // ✅ GUNAKAN TIPE GENERIK PADA PANGGILAN AXIOS
      const response = await axios.get<ApiResponse<DebtPayment[]>>(
        `/petugas/history/customer/${customerId}/debt-payments`
      );

      if (response.data && response.data.success) {
        // Data yang diterima dijamin memiliki tipe DebtPayment[]
        setDebtHistory(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil riwayat pembayaran hutang.');
      }
    } catch (err: unknown) {
      let errorMsg = 'Gagal mengambil riwayat pembayaran hutang.';
      if (isApiErrorWithMessage(err)) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
      setDebtHistory([]); // Kosongkan jika error
    }
  }, []);

  const fetchAllHistory = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchDetailedHistory(customerId),
      fetchDebtHistory(customerId)
    ]);
    setLoading(false);
  }, [fetchDetailedHistory, fetchDebtHistory]);

  const formatCurrency = useCallback((amount: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return {
    loading,
    error,
    histories,
    detailedHistory,
    debtHistory,
    customerFinancialSummary,
    summary,
    pagination,
    fetchHistories,
    fetchDetailedHistory,
    fetchDebtHistory,
    fetchAllHistory,
    formatCurrency,
    formatDate,
    assignedAreas: areaRestriction.assignedAreas,
    assignedAreaIds: areaRestriction.assignedAreaIds,
    hasAreaAccess: areaRestriction.hasAreaAccess,
    getAssignedAreasText: areaRestriction.getAssignedAreasText,
  };
}
