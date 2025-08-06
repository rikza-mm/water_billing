'use client';

// hooks/petugas/usePayment.ts
import { useCallback, useState } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/hooks/auth/useAuth';

// ✅ Interface untuk data yang dikirim ke fungsi hook
// proofUrl sekarang adalah string URL, bukan File
export interface PaymentRequestData {
  bill_id: string;
  amount: string;
  method: 'cash' | 'transfer' | 'qris';
  use_balance: boolean;
  proofUrl?: string | null; 
}

// Interface untuk respons dari API
export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export function usePayment() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  // ✅ getHeaders sekarang hanya untuk JSON
  const getHeaders = useCallback(() => {
      return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
      };
  }, [token]);

  const processPayment = useCallback(async (data: PaymentRequestData): Promise<PaymentResponse> => {
      setLoading(true);
      try {
          // ✅ Kirim data sebagai JSON biasa
          const res = await axios.post("/petugas/payments/", data, { 
              headers: getHeaders() 
          });
          return res.data;
      } catch (error: unknown) {
          // type guard as needed
          return {
              success: false,
              message: error instanceof Error ? error.message : "Gagal memproses pembayaran.",
          };
      } finally {
          setLoading(false);
      }
  }, [getHeaders]);

  return {
    loading,
    setLoading, // Ekspor setLoading agar bisa dikontrol dari luar
    processPayment,
  };
}
