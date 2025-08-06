// hooks/petugas/useCustomerSearch.ts
import axios from "@/lib/axios";
import { useCallback, useState } from "react";
import { useAuth } from "../../auth/useAuth";

// Make all properties except id and name optional for CustomerSearchResult
export interface CustomerSearchResult {
  id: string;
  name: string;
  address?: string;
  meterNumber?: string;
  lastReading?: number;
  lastReadingDate?: string;
  saldo?: number;
  hutang?: number;
  phoneNumber?: string;
  category_id?: number; // <-- Tambahkan ini
  category_name?: string; // <-- Dan ini, untuk menampilkan nama kategori
}

export function useCustomerSearch() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

/**
   * ✅ FUNGSI BARU: Khusus untuk mencari satu pelanggan berdasarkan ID-nya.
   * Mengembalikan satu objek pelanggan atau null.
   */
  const searchCustomerById = useCallback(async (customerId: string): Promise<CustomerSearchResult | null> => {
    if (!customerId.trim()) {
      setError("Nomor pelanggan tidak boleh kosong.");
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/petugas/customers/${customerId}`, { headers: getHeaders() });
      if (response.data.success && response.data.data) {
        // ✅ VALIDASI: Pastikan data valid
        const customer = response.data.data;
        if (!customer.id || !customer.name) {
          setError('Data pelanggan tidak valid');
          return null;
        }
        return {
          ...customer,
          phoneNumber: customer.phone || '',
        };
      }
      return null;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Pelanggan dengan ID tersebut tidak ditemukan.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const searchCustomersByName = useCallback(async (name: string): Promise<CustomerSearchResult[]> => {
    if (!name.trim()) {
      setError("Nama pelanggan tidak boleh kosong.");
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "/petugas/customers/search-customers",
        {
          params: { search: name, page: 1, perPage: 15 },
          headers: getHeaders(),
        }
      );
      
      if (response.data.success && response.data.data?.customers) {
        // ✅ DEDUPLIKASI: Hapus duplikat berdasarkan ID
        const customers = response.data.data.customers;
        // Mapping phone -> phoneNumber
        const mappedCustomers: CustomerSearchResult[] = customers.map((customer: Record<string, unknown>): CustomerSearchResult => ({
          ...((customer as unknown) as CustomerSearchResult),
          phoneNumber: ((customer as unknown) as { phone?: string }).phone || '',
        }));
        const uniqueCustomers = mappedCustomers.filter((customer: CustomerSearchResult, index: number, self: CustomerSearchResult[]) => 
          index === self.findIndex((c: CustomerSearchResult) => c.id === customer.id)
        );
        // ✅ VALIDASI: Pastikan semua data valid
        const validCustomers = uniqueCustomers.filter((customer: CustomerSearchResult) => 
          customer.id && customer.name
        );
        return validCustomers;
      }
      return [];
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mencari pelanggan.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    error,
    
    searchCustomersByName,
    searchCustomerById
  };
}

