import { SummaryStats } from '@/hooks/admin/customer/useAdminCustomers';
import { Users, UserPlus, AlertTriangle, MapPin } from 'lucide-react';

export const CustomerStats = ({ stats }: { stats: SummaryStats | null }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6 flex flex-col items-center justify-center">
        <Users className="w-7 h-7 text-blue-500 mb-2" />
        <div className="text-xs font-semibold text-gray-500 mb-1">Pelanggan Aktif</div>
        <div className="text-3xl font-bold text-blue-600">{stats.totalActiveCustomers}</div>
      </div>
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6 flex flex-col items-center justify-center">
        <UserPlus className="w-7 h-7 text-green-500 mb-2" />
        <div className="text-xs font-semibold text-gray-500 mb-1">Pelanggan Baru (Bulan Ini)</div>
        <div className="text-3xl font-bold text-green-600">{stats.newCustomersThisMonth}</div>
      </div>
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6 flex flex-col items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500 mb-2" />
        <div className="text-xs font-semibold text-gray-500 mb-1">Total Penunggak</div>
        <div className="text-3xl font-bold text-red-600">{stats.totalCustomersInArrears}</div>
      </div>
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6 flex flex-col items-center justify-center">
        <MapPin className="w-7 h-7 text-purple-500 mb-2" />
        <div className="text-xs font-semibold text-gray-500 mb-1">Wilayah Teratas</div>
        <div className="text-3xl font-bold text-purple-600 truncate">{stats.topArea.area_name}</div>
      </div>
    </div>
  );
};