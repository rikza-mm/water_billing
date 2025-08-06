import { useState } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { OverallSummary, OfficerLeaderboardEntry, AreaPerformanceEntry, CustomerActionLists, CustomerActionEntry } from '@/hooks/admin/analyst/useAnalystDashboard';
import { AlertCircle, Trophy, MapPin, ListChecks } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface utama untuk props tab
interface Props {
  summary: OverallSummary;
  officers: OfficerLeaderboardEntry[];
  areas: AreaPerformanceEntry[];
  lists: CustomerActionLists;
}

// Komponen utama
export const AnalystOverviewTab = ({ summary, officers, areas, lists }: Props) => {
  return (
    <div className="space-y-6">
      {/* ======================================================================= */}
      {/* === PERBAIKAN LAYOUT DI SINI (70% / 30%) === */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Kolom ini akan memakan 2/3 (sekitar 66.7%) dari lebar */}
        <div className="lg:col-span-2">
          <OverallSummaryComponent summary={summary} />
        </div>
        {/* Kolom ini akan memakan 1/3 (sekitar 33.3%) dari lebar */}
        <div className="lg:col-span-1">
          <CustomerCompositionChart summary={summary} />
        </div>
      </div>

      <PerformanceLeaderboard officers={officers} areas={areas} />
      <CustomerActionListsComponent lists={lists} />
    </div>
  );
};

// =======================================================================
// KOMPONEN-KOMPONEN ANAK (CHILD COMPONENTS)
// =======================================================================

const OverallSummaryComponent = ({ summary }: { summary: OverallSummary }) => (
    <NeumorphicCard className="h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Umum Penagihan</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard title="Pendapatan Terkumpul" value={formatCurrency(parseFloat(summary.total_pendapatan_terkumpul))} />
        <KpiCard title="Total Tunggakan" value={formatCurrency(parseFloat(summary.total_tunggakan))} />
        <KpiCard title="Tingkat Kolektibilitas" value={`${summary.collection_rate.toFixed(1)}%`} />
        <KpiCard title="Pelanggan Menunggak" value={summary.pelanggan_menunggak} />
        <KpiCard title="Pelanggan Bersaldo" value={summary.pelanggan_bersaldo} />
        <KpiCard title="Total Saldo Pelanggan" value={formatCurrency(parseFloat(summary.total_saldo_pelanggan))} />
      </div>
    </NeumorphicCard>
);

const CustomerCompositionChart = ({ summary }: { summary: OverallSummary }) => {
    const data = [
        { name: 'Normal', value: parseInt(summary.customerStatusComposition.normal, 10) },
        { name: 'Menunggak', value: parseInt(summary.customerStatusComposition.inDebt, 10) },
        { name: 'Bersaldo', value: parseInt(summary.customerStatusComposition.hasBalance, 10) },
    ];
    const COLORS = ['#10B981', '#EF4444', '#3B82F6'];

    return (
        <NeumorphicCard className="h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Komposisi Pelanggan</h3>
            <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                    <RechartsPieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" nameKey="name">
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} pelanggan`} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </div>
        </NeumorphicCard>
    );
};

// Jadikan LeaderboardCard generic agar tipe data dan renderItem konsisten
interface LeaderboardCardProps<T> {
  title: string;
  icon: React.ReactNode;
  data: T[];
  renderItem: (item: T) => {
    primaryText: string;
    secondaryText: string;
    value: number;
    isPositive: boolean;
  };
}

const LeaderboardCard = <T,>({
  title,
  icon,
  data,
  renderItem,
}: LeaderboardCardProps<T>) => (
  <div className="bg-[#e0e5ec] p-4 rounded-2xl shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] flex flex-col w-full h-full">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      {icon} {title}
    </h3>
    <ul className="space-y-2 w-full">
      {data.slice(0, 5).map((item, index) => {
        const rendered = renderItem(item);
        return (
          <li
            key={index}
            className="w-full flex justify-between items-center text-sm p-2"
          >
            <div>
              <span className="font-semibold text-gray-800">
                {index + 1}. {rendered.primaryText}
              </span>
              <p className="text-xs text-gray-500">{rendered.secondaryText}</p>
            </div>
            <span
              className={`font-bold ${
                rendered.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(rendered.value)}
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);

const PerformanceLeaderboard = ({ officers, areas }: { officers: OfficerLeaderboardEntry[], areas: AreaPerformanceEntry[] }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
    <LeaderboardCard<OfficerLeaderboardEntry>
      title="Petugas Terbaik"
      icon={<Trophy size={20} className="text-yellow-500" />}
      data={officers}
      renderItem={(item) => ({
        primaryText: item.officer_name,
        secondaryText: `${item.total_transactions} transaksi`,
        value: parseFloat(item.total_revenue),
        isPositive: true
      })}
    />
    <LeaderboardCard<AreaPerformanceEntry>
      title="Wilayah Paling Sehat"
      icon={<MapPin size={20} className="text-blue-500" />}
      data={areas.sort((a, b) => parseFloat(b.total_revenue) - parseFloat(a.total_revenue))}
      renderItem={(item) => ({
        primaryText: item.area_name,
        secondaryText: `Tunggakan: ${formatCurrency(parseFloat(item.total_tunggakan))}`,
        value: parseFloat(item.total_revenue),
        isPositive: true
      })}
    />
    <LeaderboardCard<AreaPerformanceEntry>
      title="Wilayah Bermasalah"
      icon={<AlertCircle size={20} className="text-red-500" />}
      data={areas.sort((a, b) => parseFloat(b.total_tunggakan) - parseFloat(a.total_tunggakan))}
      renderItem={(item) => ({
        primaryText: item.area_name,
        secondaryText: `${item.jumlah_pelanggan_menunggak} pelanggan menunggak`,
        value: parseFloat(item.total_tunggakan),
        isPositive: false
      })}
    />
  </div>
);

type ActionListType = keyof CustomerActionLists;
const CustomerActionListsComponent = ({ lists }: { lists: CustomerActionLists }) => {
    const [activeList, setActiveList] = useState<ActionListType>('topDefaulters');
    const tabs: { key: ActionListType; label: string; data: CustomerActionEntry[] }[] = [
        { key: 'topDefaulters', label: 'Penunggak Teratas', data: lists.topDefaulters },
        { key: 'longestOverdueCustomers', label: 'Menunggak Terlama', data: lists.longestOverdueCustomers },
        { key: 'notBilledCustomers', label: 'Belum Ditagih', data: lists.notBilledCustomers },
        { key: 'zeroUsageCustomers', label: 'Pemakaian Nol', data: lists.zeroUsageCustomers },
    ];
    const currentData = tabs.find(t => t.key === activeList)?.data || [];
    return (
        <NeumorphicCard className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ListChecks size={20} className="text-orange-500"/> Daftar Aksi Pelanggan</h3>
            <div className="flex gap-2 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveList(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] ${activeList === tab.key ? 'bg-blue-500 text-white scale-105 shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff]' : 'bg-[#e0e5ec] text-gray-700 hover:bg-gray-100'}`}
                        style={{ border: 'none', outline: 'none' }}
                    >
                        {tab.label} <span className="ml-1 text-xs">({tab.data.length})</span>
                    </button>
                ))}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentData.length > 0 ? currentData.map(customer => (
                    <div key={customer.customer_id} className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{customer.full_name}</p>
                            <p className="text-xs text-gray-500">Wilayah: <span className="font-medium text-blue-600">{customer.area_name}</span></p>
                            <p className="text-xs text-gray-500">Petugas: <span className="font-medium text-teal-600">{customer.officer_in_charge}</span></p>
                        </div>
                        <div className="flex flex-col md:items-end gap-1 md:text-right">
                            {customer.hutang && <span className="text-sm font-bold text-red-600">{formatCurrency(parseFloat(customer.hutang))}</span>}
                            {customer.oldest_due_date && <span className="text-xs text-orange-600">Sejak {new Date(customer.oldest_due_date).toLocaleDateString('id-ID')}</span>}
                        </div>
                    </div>
                )) : (
                    <div className="bg-[#e0e5ec] rounded-xl p-8 text-center text-gray-500 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff]">Tidak ada data untuk kategori ini.</div>
                )}
            </div>
        </NeumorphicCard>
    );
};

// =======================================================================
// KOMPONEN-KOMPONEN HELPER (PEMBANTU)
// =======================================================================

const KpiCard = ({ title, value }: { title: string; value: string; }) => (
  <div className="bg-[#e0e5ec] p-4 rounded-xl text-center shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] w-full">
    <p className="text-xs text-gray-500 mb-1">{title}</p>
    <p className="text-xl font-bold text-gray-800">{value}</p>
  </div>
);