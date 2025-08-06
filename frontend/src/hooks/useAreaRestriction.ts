import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';

interface AssignedArea {
  area_id: number;
  area_name: string;
}

interface AreaRestrictionData {
  assignedAreas: AssignedArea[];
  assignedAreaIds: number[];
  isLoading: boolean;
  error: string | null;
  hasAreaAccess: boolean;
}

interface AreaRestrictionError {
  success: false;
  message: string;
  code: 'NO_AREA_ASSIGNED' | 'CUSTOMER_AREA_RESTRICTED' | 'CUSTOMER_NOT_FOUND';
  data?: {
    customer_area: string;
    assigned_areas: string[];
  };
  debug?: {
    user_id: number;
    username: string;
    has_officer_record: boolean;
    officer_area_id: number | null;
    checked_tables: string[];
  };
}

// ✅ Move CACHE_DURATION outside component to avoid dependency issues
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

/**
 * Hook untuk mengelola informasi area restriction petugas
 * Menyediakan informasi area yang ditugaskan dan validasi akses
 */
export const useAreaRestriction = () => {
  const [areaData, setAreaData] = useState<AreaRestrictionData>({
    assignedAreas: [],
    assignedAreaIds: [],
    isLoading: true,
    error: null,
    hasAreaAccess: false
  });

  // ✅ Tambahkan ref untuk mencegah multiple calls
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  // ✅ Load dari localStorage saat mount
  useEffect(() => {
    const cached = localStorage.getItem('userAreaInfo');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAreaData(prev => ({
          ...prev,
          assignedAreas: parsed.assignedAreas || [],
          assignedAreaIds: parsed.assignedAreaIds || [],
          hasAreaAccess: (parsed.assignedAreaIds || []).length > 0,
          isLoading: false
        }));
      } catch {
      }
    }
  }, []);

  const updateAreaInfo = useCallback((assignedAreas: AssignedArea[]) => {
    const assignedAreaIds = assignedAreas.map(area => area.area_id);
    
    const areaInfo = {
      assignedAreas,
      assignedAreaIds,
      isLoading: false,
      error: null,
      hasAreaAccess: assignedAreaIds.length > 0
    };

    setAreaData(areaInfo);

    // ✅ Cache ke localStorage
    localStorage.setItem('userAreaInfo', JSON.stringify({
      assignedAreas,
      assignedAreaIds
    }));
  }, []);

  const refreshAreaInfo = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchRef.current < CACHE_DURATION) {
      return;
    }

    isFetchingRef.current = true;
    setAreaData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // ✅ PERBAIKAN: Endpoint yang sesuai dengan struktur database
      const response = await axios.get('/petugas/permissions/check');
      
      if (response.data.success && response.data.data) {
        const { assignedAreas } = response.data.data;
        updateAreaInfo(assignedAreas || []);
        lastFetchRef.current = now;
      } else {
        throw new Error(response.data.message || 'Gagal memuat informasi area.');
      }
    } catch {
      setAreaData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Gagal memuat informasi area',
        hasAreaAccess: false
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [updateAreaInfo]);

  // Handle area restriction error dari API
  const handleAreaRestrictionError = (error: AreaRestrictionError) => {

    switch (error.code) {
      case 'NO_AREA_ASSIGNED':
        // ✅ SOLUSI PERMANEN: Hapus semua toast error yang mengganggu
        // Jika user bisa mengakses dashboard customer, berarti sudah di-assign
        // Error handling akan ditangani di level middleware backend

        // ✅ Enhanced: Show debug info hanya di console (tidak di toast)
        if (error.debug) {
        }

        // ✅ Set state untuk NO_AREA_ASSIGNED
        setAreaData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
          hasAreaAccess: false,
          assignedAreas: [],
          assignedAreaIds: []
        }));
        break;

      case 'CUSTOMER_AREA_RESTRICTED':
        const customerArea = error.data?.customer_area || 'tidak diketahui';
        const assignedAreas = error.data?.assigned_areas?.join(', ') || 'tidak ada';

        toast.error(
          `Akses ditolak. Pelanggan berada di wilayah ${customerArea}. ` +
          `Anda hanya dapat mengakses wilayah: ${assignedAreas}`
        );
        break;

      case 'CUSTOMER_NOT_FOUND':
        toast.error('Pelanggan tidak ditemukan');
        break;

      default:
        toast.error(error.message || 'Terjadi kesalahan akses wilayah');
    }
  };

  // Check if user has access to specific area
  const hasAccessToArea = (areaId: number): boolean => {
    return areaData.assignedAreaIds.includes(areaId);
  };

  // Get area name by ID
  const getAreaNameById = (areaId: number): string => {
    const area = areaData.assignedAreas.find(area => area.area_id === areaId);
    return area?.area_name || 'Area tidak diketahui';
  };

  // Format assigned areas for display
  const getAssignedAreasText = (): string => {
    if (areaData.assignedAreas.length === 0) {
      return 'Belum ada area yang ditugaskan';
    }

    return areaData.assignedAreas.map(area => area.area_name).join(', ');
  };

  // Clear area info (untuk logout)
  const clearAreaInfo = () => {
    localStorage.removeItem('userAreaInfo');
    setAreaData({
      assignedAreas: [],
      assignedAreaIds: [],
      isLoading: false,
      error: null,
      hasAreaAccess: false
    });
  };

  // ✅ PERBAIKAN: Method untuk menandai loading selesai tanpa area
  const setNoAreaAccess = () => {
    setAreaData(prev => ({
      ...prev,
      isLoading: false,
      hasAreaAccess: false,
      assignedAreas: [],
      assignedAreaIds: []
    }));
  };

  // ✅ PERBAIKAN: Method untuk force update area info (untuk debugging)
  const forceUpdateAreaInfo = (areas: AssignedArea[]) => {
    updateAreaInfo(areas);
  };

  // ✅ GANTI: Hanya refresh sekali saat mount
  useEffect(() => {
    // Hanya refresh sekali saat mount
    refreshAreaInfo();
  }, [refreshAreaInfo]); // Include refreshAreaInfo in dependencies

  return {
    // Data
    assignedAreas: areaData.assignedAreas,
    assignedAreaIds: areaData.assignedAreaIds,
    isLoading: areaData.isLoading,
    error: areaData.error,
    hasAreaAccess: areaData.hasAreaAccess,

    // Methods
    updateAreaInfo,
    handleAreaRestrictionError,
    hasAccessToArea,
    getAreaNameById,
    getAssignedAreasText,
    clearAreaInfo,
    setNoAreaAccess, // ✅ PERBAIKAN: Export method baru
    forceUpdateAreaInfo, // ✅ PERBAIKAN: Export method untuk debugging
    refreshAreaInfo // ✅ Ganti fetchAreaInfo dengan refreshAreaInfo yang baru
  };
};

/**
 * Helper function untuk menangani API response yang mengandung area restriction error
 */
export const handleApiAreaError = (error: unknown, areaRestrictionHook: ReturnType<typeof useAreaRestriction>) => {
  // Type guard for error object
  const err = error as { response?: { data?: Partial<AreaRestrictionError> & { debug?: unknown } ; status?: number } };
  // ✅ PERBAIKAN: Hanya log untuk debugging, tidak tampilkan error

  if (err.response?.data?.code &&
      ['NO_AREA_ASSIGNED', 'CUSTOMER_AREA_RESTRICTED', 'CUSTOMER_NOT_FOUND'].includes(err.response.data.code!)) {

    // Handle area restriction error
    const errorData: AreaRestrictionError = {
      ...(err.response.data as AreaRestrictionError),
      debug: typeof err.response.data.debug !== 'undefined' ? err.response.data.debug : undefined
    };

    areaRestrictionHook.handleAreaRestrictionError(errorData);
    return true; // Error handled
  }
  return false; // Error not handled, let other error handlers deal with it
};

export default useAreaRestriction;
