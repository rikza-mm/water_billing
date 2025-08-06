import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';

// ===== 1. DEFINISI TIPE DATA =====
export interface CustomerSearchResult {
  customer_id: number;
  full_name: string;
  saldo: number;
  hutang: number;
  meter_number?: string;
  phone_number?: string;
  address?: string;
  area_name?: string;
  status?: string;
}

// Tipe untuk profil pelanggan
export interface CustomerProfile {
  customerName: string;
  address: string;
  phone: string;
  meterNumber: string;
  area: string;
  saldo: string;
  hutang: string;
}

// Tipe untuk ringkasan keuangan
export interface FinancialSummary {
  totalTagihan: number;
  totalDibayar: number;
  totalHutang: string;
  rataRataTagihan: number;
}

// Tipe untuk petugas (digunakan di dalam riwayat)
interface Officer {
  user_id: number | null;
  full_name: string | null;
}

// Tipe untuk satu baris di tabel riwayat tagihan
export interface BillingHistoryItem {
  bill_id: number;
  payment_id: number | null;
  periode: string;
  previous_reading: string;
  current_reading: string;
  pemakaian: string;
  jumlah: string;
  dibayar: string;
  sisa: string;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  jatuh_tempo: string;
  metode: 'cash' | 'transfer' | 'qris' | null;
  tgl_bayar: string | null;
  catatan_meter: string | null;   // <-- Diperbarui
  catatan_tagihan: string | null; // <-- Baru
  bukti_meter: string | null;     // <-- Baru dan lebih jelas
  bukti_bayar: string | null;     // <-- Baru dan lebih jelas
  petugas_pencatat: Officer;
  petugas_kasir: Officer;
}

// Tipe untuk satu baris di tabel pembayaran hutang
export interface DebtHistoryItem {
  payment_id: number;
  total_payment_amount: string;
  method: string;
  transaction_date: string;
  petugas_kasir: Officer;
  allocations: Array<{ bill_id: number; bill_period: string; allocated_amount: number }>;
}

// Tipe gabungan untuk seluruh data yang di-fetch
export interface AdminCustomerHistory {
  customerProfile: CustomerProfile;
  financialSummary: FinancialSummary;
  billingHistory: BillingHistoryItem[];
  debtHistory: DebtHistoryItem[];
}

// ✅ TIPE BARU: Sesuai dengan respons endpoint detail pembayaran
export interface PaymentDetails {
  payment_id: number;
  transaction_date: string;
  method: string;
  amount: number;
  balance_used: number;
  total_payment_power: number;
  proof_url: string | null;
  officer: { user_id: number; full_name: string };
  customer: { customer_id: number; full_name: string };
  documents: Array<{ document_type: 'receipt' | 'history'; url: string }>;
  allocations: Array<{ bill_id: number; bill_period: string; allocated_amount: number }>;
}

// ===== 2. CUSTOM HOOK-NYA =====

export function useAdminCustomerHistory() {
  // State untuk detail pelanggan
  const [historyData, setHistoryData] = useState<AdminCustomerHistory | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  // State untuk daftar pelanggan hasil pencarian
  const [customerList, setCustomerList] = useState<CustomerSearchResult[]>([]);

  // State loading terpisah
  const [isListLoading, setIsListLoading] = useState<boolean>(false);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  /**
   * Mengambil daftar pelanggan, bisa dengan filter pencarian.
   * @param searchTerm - Kata kunci pencarian (opsional).
   */
  const fetchCustomerList = useCallback(async (searchTerm?: string) => {
    setIsListLoading(true);
    setError(null);
    try {
      const response = await axios.get('/admin/history/customers/list', {
        params: { search: searchTerm || '' }
      });
      if (response.data.success) {
        setCustomerList(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat daftar pelanggan.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
      setError(message);
      toast.error(message);
      setCustomerList([]);
    } finally {
      setIsListLoading(false);
    }
  }, []);

  /**
   * Mengambil detail lengkap untuk SATU pelanggan.
   */
  const fetchCustomerHistory = useCallback(async (customerId: string) => {
    setIsDetailLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/admin/history/customer/${customerId}`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data riwayat.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
      setError(message);
      toast.error(message);
      setHistoryData(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  /**
   * Mengambil detail satu pembayaran spesifik.
   */
  const fetchPaymentDetails = useCallback(async (paymentId: number | string) => {
    setIsDetailLoading(true);
    setPaymentDetails(null);
    try {
      const response = await axios.get(`/admin/history/payment/${paymentId}`);
      if (response.data.success) {
        setPaymentDetails(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat detail pembayaran.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
      toast.error(message);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  return {
    historyData,
    paymentDetails,
    customerList,
    isListLoading,
    isDetailLoading,
    error,
    fetchCustomerList,
    fetchCustomerHistory,
    fetchPaymentDetails,
  };
}