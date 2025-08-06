import { User, MapPin, Calendar, Phone, MessageCircle, Users, BookOpen } from 'lucide-react';

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

  // Tambahan dari backend
  total_customers_handled?: number;
  total_readings_made?: number;
}

interface ProfileCardProps {
  profile: OfficerProfile;
  loading?: boolean;
}

export default function ProfileCard({ profile, loading = false }: ProfileCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-' || dateString === '0000-00-00') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'text-green-600 bg-green-100'
      : 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="bg-[#e0e5ec] rounded-2xl shadow-neumorph p-4 md:p-6 animate-pulse min-h-[220px] transition-all duration-500">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="
      bg-[#e0e5ec] rounded-xl
      shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
      p-4
      transition-all duration-500
      hover:shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]
      group
    ">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-[inset_4px_4px_12px_#bebebe,inset_-4px_-4px_12px_#ffffff] group-hover:scale-105 transition-transform duration-500">
          <User className="w-10 h-10 text-white drop-shadow-lg" />
        </div>
        <h3 className="font-poppins font-semibold text-lg text-gray-800 text-center mt-2 transition-colors duration-300">
          {profile.full_name || '-'}
        </h3>
        <span className="text-xs text-gray-500 font-nunito">{profile.username || '-'} • {profile.role || '-'}</span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <Phone className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">Telepon</p>
            <p className="font-poppins text-sm text-gray-800">{profile.phone_number || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">WhatsApp</p>
            <p className="font-poppins text-sm text-gray-800">{profile.whatsapp_number || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <MapPin className="w-5 h-5 text-purple-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">Area Tugas</p>
            <p className="font-poppins text-sm text-gray-800">{profile.assigned_areas || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <Calendar className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">Bergabung</p>
            <p className="font-poppins text-sm text-gray-800">
              {formatDate(profile.join_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">Total Pembacaan</p>
            <p className="font-poppins text-sm text-gray-800">{profile.total_readings || profile.total_readings_made || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <Users className="w-5 h-5 text-cyan-600" />
          <div>
            <p className="font-nunito text-xs text-gray-500">Total Pelanggan</p>
            <p className="font-poppins text-sm text-gray-800">{profile.total_customers || profile.total_customers_handled || 0}</p>
          </div>
        </div>
      </div>

      {/* Status & Performance */}
      <div className="flex justify-center gap-3 mt-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${getStatusColor(profile.status)}`}>
          {profile.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${getPerformanceColor(profile.performance_score)}`}>
          Performa: {profile.performance_score}%
        </span>
      </div>
    </div>
  );
}
