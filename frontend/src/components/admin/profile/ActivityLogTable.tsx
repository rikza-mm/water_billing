import { NeumorphicCard } from '@/components/NeumorphicCard';
import { ActivityLog } from '@/hooks/admin/profile/useAdminProfile';
import { FileClock } from 'lucide-react';

interface Props {
  logs: ActivityLog[];
}

export const ActivityLogTable = ({ logs }: Props) => (
  <NeumorphicCard>
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileClock /> Riwayat Aktivitas (Audit Trail)</h3>
    <div className="overflow-x-auto max-h-96">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-2 text-left">Waktu</th>
            <th className="p-2 text-left">Aksi</th>
            <th className="p-2 text-left">Deskripsi</th>
            <th className="p-2 text-left">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{new Date(log.created_at).toLocaleString('id-ID')}</td>
              <td className="p-2 font-semibold">{log.action}</td>
              <td className="p-2">{log.description}</td>
              <td className="p-2 text-gray-500">{log.ip_address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </NeumorphicCard>
);