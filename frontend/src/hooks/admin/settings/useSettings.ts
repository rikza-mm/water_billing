import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';

export interface Settings {
  bank_account_bca?: string;
  bank_account_mandiri?: string;
  qris_image_url?: string;
  Maps_url?: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      } else {
        setError('Gagal memuat data pengaturan');
        toast.error('Gagal memuat data pengaturan');
      }
    } catch {
      setError('Gagal memuat data pengaturan');
      toast.error('Gagal memuat data pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    setSaving(true);
    setError(null);
    try {
      const res = await axios.put('/admin/settings', newSettings);
      if (res.data.success) {
        setSettings(newSettings);
        toast.success('Pengaturan berhasil disimpan');
      } else {
        setError(res.data.message || 'Gagal menyimpan pengaturan');
        toast.error(res.data.message || 'Gagal menyimpan pengaturan');
      }
    } catch {
      setError('Gagal menyimpan pengaturan');
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    settings,
    setSettings,
    loading,
    saving,
    error,
    fetchSettings,
    updateSettings,
  };
} 