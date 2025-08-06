"use client";

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

// =======================================================================
// INTERFACES (Sesuai dengan struktur respons backend)
// =======================================================================

export interface ProfileInfo {
  user_id: number;
  username: string;
  full_name: string;
  phone_number: string;
  last_login: string;
}

export interface ActivitySummary {
  total_financial_transactions: number;
  total_book_closings: number;
}

export interface ActivityLog {
  action: string;
  description: string;
  ip_address: string;
  device_info: string;
  created_at: string;
}

export interface AdminProfileData {
  profileInfo: ProfileInfo;
  activitySummary: ActivitySummary;
  activityLog: ActivityLog[];
}

// =======================================================================
// THE HOOK
// =======================================================================

export function useAdminProfile() {
  const [data, setData] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/profile');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data profil.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fungsi untuk update profil
  const updateProfile = useCallback(async (profileData: { full_name: string; phone_number: string; username: string; }) => {
    try {
      const response = await api.put('/admin/profile', profileData);
      if (response.data.success) {
        toast.success(response.data.message || 'Profil berhasil diperbarui.');
        await fetchData(); // Muat ulang data setelah berhasil
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [fetchData]);

  // Fungsi untuk ganti password
  const changePassword = useCallback(async (passwordData: { oldPassword: string; newPassword: string; }) => {
    try {
      const response = await api.put('/admin/profile/change-password', passwordData);
       if (response.data.success) {
        toast.success(response.data.message || 'Password berhasil diubah.');
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengubah password.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData,
    updateProfile,
    changePassword,
  };
}