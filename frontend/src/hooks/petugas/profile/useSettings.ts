import { useState, useCallback, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAreaRestriction } from '@/hooks/useAreaRestriction';

// ✅ KONSISTENSI: Interface yang sama dengan admin dashboard
interface AreaInfo {
  area_id: number;
  name: string;
  postal_code?: string;
  total_customers: number;
}

interface OfficerProfile {
  // Basic info (sama dengan admin Officer interface)
  officer_id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  phone_number: string;
  whatsapp_number?: string;
  role: string;
  is_active: boolean;
  salary: number;
  join_date: string;
  last_login?: string;

  // Area assignment (sama dengan admin dashboard)
  areas: AreaInfo[];
  total_areas: number;
  assigned_areas: string;

  // Performance metrics
  total_customers: number;
  active_customers: number;
  total_readings: number;
  current_month_readings: number;
  total_collections: number;
  last_30_days_collections: number;

  // Calculated metrics
  performance_score: number;
  efficiency: number;
  average_readings_per_day: number;

  // Status
  status: 'active' | 'inactive';
}

export function useSettings() {
  const [loading, setLoading] = useState(true);
  const areaRestriction = useAreaRestriction();
  const [profile, setProfile] = useState<OfficerProfile>({
    officer_id: 0,
    user_id: 0,
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    role: 'petugas',
    is_active: false,
    salary: 0,
    join_date: '',
    last_login: '',
    areas: [],
    total_areas: 0,
    assigned_areas: '',
    total_customers: 0,
    active_customers: 0,
    total_readings: 0,
    current_month_readings: 0,
    total_collections: 0,
    last_30_days_collections: 0,
    performance_score: 0,
    efficiency: 0,
    average_readings_per_day: 0,
    status: 'active',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/petugas/profile');
      if (response.data.success && response.data.data) {
        const user = response.data.data;

        setProfile({
          officer_id: user.user_id,
          user_id: user.user_id,
          username: user.username || '-',
          full_name: user.full_name || '-',
          email: user.email || '-',
          phone_number: user.phone_number || '-',
          whatsapp_number: user.whatsapp_number || '-',
          role: user.role || 'petugas',
          is_active: true,
          salary: 0,
          join_date: user.join_date || '-',
          last_login: user.last_login || '-',
          areas: user.assigned_areas
            ? [{ area_id: 0, name: user.assigned_areas, total_customers: user.total_customers_handled || 0 }]
            : [],
          total_areas: user.assigned_areas ? 1 : 0,
          assigned_areas: user.assigned_areas || '-',
          total_customers: user.total_customers_handled || 0,
          active_customers: 0,
          total_readings: user.total_readings_made || 0,
          current_month_readings: 0,
          total_collections: 0,
          last_30_days_collections: 0,
          performance_score: 0,
          efficiency: 0,
          average_readings_per_day: 0,
          status: 'active',
        });

        // (Opsional) update area restriction jika ada info area id
        // areaRestriction.updateAreaInfo(...);
      } else {
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    loading,
    profile,
    refreshProfile: fetchProfile,
    hasAreaAccess: areaRestriction.hasAreaAccess,
    assignedAreas: areaRestriction.assignedAreas,
    assignedAreaIds: areaRestriction.assignedAreaIds,
  };
}
