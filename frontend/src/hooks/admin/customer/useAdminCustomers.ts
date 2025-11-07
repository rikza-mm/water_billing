import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/axios'; // Asumsi Anda punya konfigurasi axios
import { debounce } from 'lodash';

// Tipe data kategori pelanggan
export interface CustomerCategory {
  category_id: number;
  category_name: string;
}

// Tipe data area
export interface AreaOption {
  area_id: number;
  area_name: string;
}

// Definisikan tipe data agar sesuai dengan respons API
export interface Customer {
  id: number;
  name: string;
  full_name?: string;
  meterNumber?: string;
  meter_number?: string;
  address: string;
  area: string;
  area_id?: number;
  category_id?: number;
  category_name?: string;
  status: 'active' | 'inactive' | 'suspended';
  saldo: string;
  hutang: string;
  unpaidBills: number;
  phoneNumber?: string;
  whatsapp_number?: string;
  registration_date?: string;
}

export interface Pagination {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface SummaryStats {
  totalActiveCustomers: number;
  newCustomersThisMonth: number;
  totalCustomersInArrears: number;
  customersNeverPaid: number;
  topArea: { area_name: string; count: number };
}

export interface Filters {
  search: string;
  status: string;
  area: string;
  category: string;
  arrears: string;
  page: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

// Tipe data untuk form customer
export type CustomerFormData = {
  full_name: string;
  area_id: string;
  category_id: string;
  phoneNumber: string;
  address: string;
  meter_number?: string;
  whatsapp_number?: string;
};

// Tipe data untuk update customer
export type CustomerUpdateData = {
  full_name?: string;
  phone_number?: string;
  whatsapp_number?: string;
  address?: string;
  area_id?: string;
  category_id?: string;
  meter_number?: string;
};

export interface BillingHistoryItem {
  bill_id: number;
  period_start: string;
  period_end: string;
  amount: number;
  paid_amount: number;
  bill_status: 'paid' | 'unpaid' | 'partial';
}

export interface PaymentHistoryItem {
  payment_id: number;
  transaction_date: string;
  amount: number;
  method: string;
}

export interface CustomerDetail {
  profile: Customer;
  billingHistory: BillingHistoryItem[];
  paymentHistory: PaymentHistoryItem[];
}

export function useAdminCustomers() {
  const [data, setData] = useState<{
    customers: Customer[];
    pagination: Pagination | null;
    summaryStats: SummaryStats | null;
  }>({ customers: [], pagination: null, summaryStats: null });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    area: 'all',
    category: 'all',
    arrears: 'all',
    page: 1,
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  // State untuk data area dan kategori
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // ✅ AMBIL DATA AREA DARI API
  const fetchAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const response = await api.get('/admin/customers/areas/list');
      if (response.data.success) {
        setAreas(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data area.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data area.');
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  // ✅ AMBIL DATA KATEGORI DARI API
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get('/admin/customers/categories/list');
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data kategori.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data kategori.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // ✅ AMBIL DATA PELANGGAN DENGAN FILTER
  const fetchData = useCallback(async (currentFilters: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentFilters.page),
        search: currentFilters.search,
        status: currentFilters.status,
        area: currentFilters.area,
        category: currentFilters.category,
        arrears: currentFilters.arrears,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        perPage: '10'
      });
      
      const response = await api.get(`/admin/customers?${params.toString()}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce fetch
  const debouncedFetchData = useMemo(() => debounce(fetchData, 500), [fetchData]);

  // ✅ LOAD DATA SAAT KOMPONEN MOUNT
  useEffect(() => {
    fetchAreas();
    fetchCategories();
  }, [fetchAreas, fetchCategories]);

  useEffect(() => {
    debouncedFetchData(filters);
    return () => debouncedFetchData.cancel();
  }, [filters, debouncedFetchData]);
  
  const setFilter = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const setSort = (newSortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  const goToPage = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // ✅ AMBIL DETAIL PELANGGAN
  const fetchCustomerDetail = async (customerId: number) => {
    if (typeof customerId !== 'number' || isNaN(customerId)) {
      throw new Error('ID pelanggan tidak valid (bukan angka).');
    }
    try {
      const response = await api.get(`/admin/customers/${customerId}`);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Gagal mengambil detail pelanggan.');
      }
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Terjadi kesalahan pada server.');
    }
  };

  // ✅ UPDATE DATA PELANGGAN
  const updateCustomer = async (customerId: number, updateData: CustomerUpdateData) => {
    try {
      const response = await api.patch(`/admin/customers/${customerId}`, updateData);
      if (response.data.success) {
        debouncedFetchData(filters);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Gagal update data pelanggan.');
      }
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal update data pelanggan.');
    }
  };

  // ✅ UPDATE STATUS PELANGGAN
  const updateCustomerStatus = async (customerId: number, status: string) => {
    try {
      const response = await api.patch(`/admin/customers/${customerId}/status`, { status });
      if (response.data.success) {
        debouncedFetchData(filters);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Gagal update status pelanggan.');
      }
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal update status pelanggan.');
    }
  };

  // ✅ TAMBAH CUSTOMER BARU
  const createCustomer = async (data: CustomerFormData) => {
    try {
      // Map phoneNumber (camelCase) to phone_number (snake_case) for backend
      const customerData = {
        ...data,
        phone_number: data.phoneNumber,
        status: 'active',
      };
      const response = await api.post('/admin/customers', customerData);
      if (response.data.success) {
        debouncedFetchData(filters);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Gagal menambah customer baru.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) throw new Error(err.message || 'Gagal menambah customer baru.');
      throw new Error('Gagal menambah customer baru.');
    }
  };

  // Fungsi baru untuk update state lokal customer
  const updateCustomerInState = (updatedCustomer: Partial<Customer>) => {
    setData(prevData => {
      if (!prevData.customers) return prevData;
      const newCustomers = prevData.customers.map(customer => {
        if (customer.id === updatedCustomer.id) {
          // Gabungkan data lama dengan data baru
          return { ...customer, ...updatedCustomer };
        }
        return customer;
      });
      return { ...prevData, customers: newCustomers };
    });
  };

  // ✅ REFRESH DATA
  const refreshData = () => {
    debouncedFetchData(filters);
  };

  return {
    ...data,
    loading,
    error,
    filters,
    setFilter,
    setSort,
    goToPage,
    areas,
    loadingAreas,
    categories,
    loadingCategories,
    fetchCustomerDetail,
    updateCustomer,
    updateCustomerStatus,
    createCustomer,
    refreshData,
    updateCustomerInState, // Ekspor fungsi baru
  };
}