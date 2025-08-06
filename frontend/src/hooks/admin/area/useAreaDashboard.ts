import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { AxiosError } from 'axios';

// Types
export interface Area {
  area_id: number;
  area_name: string;
  postal_code?: string;
  created_at: string;
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  total_officers: number;
  total_revenue: number;
  unpaid_bills: number;
  assigned_officers: AssignedOfficer[];
}

export interface AssignedOfficer {
  user_id: number;
  full_name: string;
  username: string;
  phone_number: string;
  is_active: boolean;
  total_customers: number;
}

export interface AreaMetadata {
  total_areas: number;
  areas_with_officers: number;
  areas_without_officers: number;
  total_customers: number;
  total_officers: number;
  average_customers_per_area: number;
  total_revenue: number;
  total_unpaid_bills: number;
  current_page: number;
  total_pages: number;
  total_items: number;
}

export interface AreaFilters {
  search?: string;
  has_officers?: boolean;
  has_customers?: boolean;
  postal_code?: string;
  page?: number;
  limit?: number;
}

export interface AreaCreateInput {
  area_name: string;
  postal_code?: string;
}

export interface AreaUpdateInput {
  area_name?: string;
  postal_code?: string;
}

export interface AreaDetails extends Area {
  recent_activities: RecentActivity[];
}

export interface RecentActivity {
  activity_type: string;
  activity_date: string;
  customer_name: string;
  officer_name?: string;
}

export interface AvailableOfficer {
  user_id: number;
  full_name: string;
  username: string;
  phone_number: string;
  is_active: boolean;
}

export const useAreaDashboard = () => {
  // State
  const [areas, setAreas] = useState<Area[]>([]);
  const [metadata, setMetadata] = useState<AreaMetadata | null>(null);
  const [availableOfficers, setAvailableOfficers] = useState<AvailableOfficer[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Functions
  const fetchAreas = useCallback(async (filters?: AreaFilters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.has_officers !== undefined) params.append('has_officers', filters.has_officers.toString());
      if (filters?.has_customers !== undefined) params.append('has_customers', filters.has_customers.toString());
      if (filters?.postal_code) params.append('postal_code', filters.postal_code);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`/admin/areas?${params.toString()}`);

      if (response.data.success) {
        setAreas(response.data.data);
        setMetadata(response.data.metadata);
      }
      setError(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Gagal mengambil data area');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableOfficers = useCallback(async () => {
    try {
      const response = await axios.get('/admin/officers?available_for_assignment=true');
      if (response.data.success) {
        setAvailableOfficers(response.data.data);
      }
    } catch {
    }
  }, []);

  const fetchDashboardData = useCallback(async (filters?: AreaFilters) => {
    await Promise.all([fetchAreas(filters), fetchAvailableOfficers()]);
  }, [fetchAreas, fetchAvailableOfficers]);

  // CRUD Operations
  const createArea = useCallback(async (data: AreaCreateInput) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/areas', data);

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal menambah area');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal menambah area';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const updateArea = useCallback(async (id: number, data: AreaUpdateInput) => {
    try {
      setLoading(true);
      const response = await axios.put(`/admin/areas/${id}`, data);

      if (response.data.success) {
        await fetchDashboardData();
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal mengupdate area');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal mengupdate area';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const deleteArea = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/admin/areas/${id}`);

      if (response.data.success) {
        await fetchDashboardData();
        return true;
      }
      throw new Error(response.data.message || 'Gagal menghapus area');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal menghapus area';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  // Officer Assignment Operations
  const assignOfficerToArea = useCallback(async (areaId: number, officerId: number) => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officer-areas/assign', {
        area_id: areaId,
        user_id: officerId
      });

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

  const unassignOfficerFromArea = useCallback(async (areaId: number, officerId: number) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/admin/officer-areas/${officerId}/${areaId}`);

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

  const transferOfficer = useCallback(async (officerId: number, fromAreaId: number, toAreaId: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.post('/admin/officer-areas/transfer', {
        user_id: officerId,
        from_area_id: fromAreaId,
        to_area_id: toAreaId
      });

      if (response.data.success) {
        await fetchDashboardData();
        return;
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

  const getAreaDetails = useCallback(async (areaId: number): Promise<AreaDetails> => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/areas/${areaId}/details`);

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Gagal mengambil detail area');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Gagal mengambil detail area';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAreaData = useCallback(async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      const response = await axios.get(`/admin/areas/export?format=${format}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `area-data.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch {
      const errorMessage = 'Gagal mengekspor data area';
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
    areas,
    metadata,
    availableOfficers,
    selectedArea,
    loading,
    error,

    // Actions
    fetchAreas,
    fetchAvailableOfficers,
    fetchDashboardData,
    createArea,
    updateArea,
    deleteArea,
    assignOfficerToArea,
    unassignOfficerFromArea,
    transferOfficer,
    getAreaDetails,
    exportAreaData,

    // Setters
    setSelectedArea,

    // Utilities
    clearError,
    refreshData
  };
};
