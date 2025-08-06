import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { AxiosError } from 'axios';

// Types
export interface Officer {
  officer_id: number;
  user_id: number;
  username: string;
  full_name: string;
  phone_number: string;
  whatsapp_number?: string;
  role: string;
  is_active: boolean;
  salary: number;
  join_date: string;
  last_login?: string;
  total_customers: number;
  areas: AreaInfo[];
  status: 'active' | 'inactive';
}

export interface AreaInfo {
  name: string;
}

export interface OfficerMetadata {
  total_officers: number;
  active_officers: number;
  inactive_officers: number;
  total_areas: number;
  total_customers: number;
  unassigned_officers: number;
  areas_without_officers: number;
  average_customers_per_officer: number;
  total_areas_covered: number;
  total_customers_served: number;
  current_page: number;
  total_pages: number;
  total_items: number;
}

export interface OfficerFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  area_id?: number;
  has_area?: boolean;
  available_for_assignment?: boolean;
  page?: number;
  limit?: number;
}

export interface OfficerCreateInput {
  username: string;
  password: string;
  full_name: string;
  phone_number: string;
  whatsapp_number?: string;
  salary?: number;
  join_date?: string;
  area_ids?: number[];
}

export interface OfficerUpdateInput {
  username?: string;
  password?: string;
  full_name?: string;
  phone_number?: string;
  whatsapp_number?: string;
  salary?: number;
  join_date?: string;
  is_active?: boolean;
  area_ids?: number[];
}

export interface AvailableArea {
  area_id: number;
  area_name: string;
  postal_code?: string;
  total_customers: number;
  total_officers: number;
}

export interface OfficerAreaAssignment {
  user_id: number;
  area_id: number;
}

export const useOfficerDashboard = () => {
  // State
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [metadata, setMetadata] = useState<OfficerMetadata | null>(null);
  const [availableAreas, setAvailableAreas] = useState<AvailableArea[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Functions
  const fetchOfficers = useCallback(async (filters?: OfficerFilters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.area_id) params.append('area_id', filters.area_id.toString());
      if (filters?.has_area !== undefined) params.append('has_area', filters.has_area.toString());
      if (filters?.available_for_assignment) params.append('available_for_assignment', 'true');
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`/admin/officers?${params.toString()}`);

      if (response.data.success) {
        setOfficers(response.data.data);
        setMetadata(response.data.metadata);
      }
      setError(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Gagal mengambil data petugas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableAreas = useCallback(async () => {
    try {
      const response = await axios.get('/admin/officers/areas');
      if (response.data.success) {
        setAvailableAreas(response.data.data);
      }
    } catch {
    }
  }, []);

  const fetchDashboardData = useCallback(async (filters?: OfficerFilters) => {
    await Promise.all([fetchOfficers(filters), fetchAvailableAreas()]);
  }, [fetchOfficers, fetchAvailableAreas]);

  // CRUD Operations
  const createOfficer = useCallback(async (data: OfficerCreateInput) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officers', data);

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal menambah petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal menambah petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const updateOfficer = useCallback(async (id: number, data: OfficerUpdateInput) => {
    try {
      setLoading(true);
      const response = await axios.put(`/admin/officers/${id}`, data);

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal mengupdate petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal mengupdate petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const deleteOfficer = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/admin/officers/${id}`);

      if (response.data.success) {
        await fetchDashboardData();
        return true;
      }
      throw new Error(response.data.message || 'Gagal menghapus petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal menghapus petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  // Officer-Area Assignment Operations
  const assignOfficerToArea = useCallback(async (assignment: OfficerAreaAssignment) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officer-areas/assign', assignment);

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal menugaskan petugas ke area');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal menugaskan petugas ke area';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const bulkAssignOfficers = useCallback(async (assignments: OfficerAreaAssignment[]) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officer-areas/bulk-assign', {
        assignments
      });

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal memproses penugasan massal');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal memproses penugasan massal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const unassignOfficerFromArea = useCallback(async (userId: number, areaId: number) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/admin/officer-areas/${userId}/${areaId}`);

      if (response.data.success) {
        await fetchDashboardData();
        return true;
      }
      throw new Error(response.data.message || 'Gagal membatalkan penugasan petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal membatalkan penugasan petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const transferOfficerArea = useCallback(async (userId: number, fromAreaId: number, toAreaId: number) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officer-areas/transfer', {
        user_id: userId,
        from_area_id: fromAreaId,
        to_area_id: toAreaId
      });

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal memindahkan petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal memindahkan petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);



  const getOfficerById = useCallback(async (id: number): Promise<Officer> => {
    try {
      const response = await axios.get(`/admin/officers/${id}`);

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal mengambil detail petugas');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal mengambil detail petugas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Utility Functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Initialize data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    // State
    officers,
    metadata,
    availableAreas,
    selectedOfficer,
    loading,
    error,

    // Actions
    fetchOfficers,
    fetchAvailableAreas,
    fetchDashboardData,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    assignOfficerToArea,
    unassignOfficerFromArea,
    transferOfficerArea,
    bulkAssignOfficers,
    getOfficerById,

    // Setters
    setSelectedOfficer,

    // Utilities
    clearError,
    refreshData
  };
};
