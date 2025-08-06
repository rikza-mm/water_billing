// hooks/petugas/useMeterReadingAction.ts
import axios from "@/lib/axios";
import { useAuth } from "../../auth/useAuth";
import { useCallback, useState, useRef } from "react";

export interface RecordAndBillRequest {
  customerId: number;
  currentReading: number;
  readingDate: string;
  notes?: string;
  imageUrl: string; // <-- Ini sekarang wajib dikirim
}

interface RecordAndBillResponse {
  success: boolean;
  message: string;
  readingId?: number;
  billId?: number;
  billAmount?: number;
  imageUrl?: string;
}

interface CancelResponse {
  success: boolean;
  message: string;
}

// ✅ Type guard untuk error response
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

export function useMeterReadingAction() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // ✅ Tambahkan ref untuk mencegah multiple submissions
  const isSubmittingRef = useRef(false);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return headers;
  }, [token]);

  // ✅ Perbarui fungsi ini untuk mengirim JSON
  const recordAndCreateBill = useCallback(async (
    data: RecordAndBillRequest
  ): Promise<RecordAndBillResponse> => {
    if (isSubmittingRef.current) {
      return {
        success: false,
        message: 'Permintaan sedang diproses, silakan tunggu.'
      };
    }

    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      // ✅ PERBAIKAN: Endpoint yang sesuai dengan struktur database
      const res = await axios.post(
        "/petugas/meter-readings/record-and-bill",
        data
      );
      return res.data;
    } catch (error: unknown) {
      let message = 'Gagal mencatat meter.';
      
      // ✅ PERBAIKAN: Gunakan type guard untuk error handling
      if (isApiError(error)) {
        if (error.response?.data?.message) {
          message = error.response.data.message;
        } else if (error.message) {
          message = error.message;
        }
      }
      
      return { success: false, message };
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, []);

  const cancelReadingAndBill = useCallback(async (
    billId: string | number
  ): Promise<CancelResponse> => {
    setLoading(true);
    try {
      const res = await axios.post("/petugas/meter-readings/cancel", { billId }, { headers: getHeaders() });
      return res.data;
    } catch (error: unknown) {
      let message = 'Gagal membatalkan tagihan.';
      
      // ✅ PERBAIKAN: Gunakan type guard untuk error handling
      if (isApiError(error)) {
        if (error.response?.data?.message) {
          message = error.response.data.message;
        } else if (error.message) {
          message = error.message;
        }
      }
      
      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    recordAndCreateBill,
    cancelReadingAndBill
  };
}
