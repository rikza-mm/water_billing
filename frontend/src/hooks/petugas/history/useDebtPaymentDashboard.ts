// File: hooks/petugas/useDebtPaymentDashboard.ts

import { useState, useCallback } from 'react';
import axios from '@/lib/axios';

export interface PayDebtRequest {
  customer_id: number;
  amount: number;
  method: 'cash' | 'transfer' | 'qris';
  proofUrl?: string | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export function useDebtPaymentDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const payDebt = useCallback(async (data: PayDebtRequest): Promise<ApiResponse<unknown>> => {
    setLoading(true);
    setError('');

    try {
      // ✅ Kirim data sebagai JSON, bukan FormData
      const response = await axios.post('/petugas/payments/pay-debt', data);
      return response.data;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      const message = apiError?.response?.data?.message || 'Gagal melakukan pembayaran hutang';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ HANYA ekspor 'loading', 'error', dan 'payDebt'. JANGAN ekspor 'setLoading'.
  return { loading, error, payDebt };
}
