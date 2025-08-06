import { useState } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { OfficerDetailData } from '@/hooks/admin/analyst/useAnalystDashboard';
import { formatCurrency } from '@/lib/utils';
import { User, DollarSign, List, MapPin, BarChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface Props {
  dateRange: { start: string; end: string; };
  fetchOfficerDetail: (officerId: number) => Promise<OfficerDetailData>;
  officersList: { id: number; name: string; }[];
}

export const OfficerDetailTab = ({ dateRange, fetchOfficerDetail, officersList }: Props) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [officerData, setOfficerData] = useState<OfficerDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectOfficer = (id: number) => {
    if (!id) {
        setOfficerData(null);
        setSelectedOfficerId(null);
        return;
    }
    setSelectedOfficerId(id);
    setIsLoading(true);
    fetchOfficerDetail(id)
      .then(setOfficerData)
      .finally(() => setIsLoading(false));
  };

  return (
    <NeumorphicCard className="p-6 rounded-2xl shadow-[4px_4px_12px_#bebebe,-4px_-4px_12px_#ffffff] bg-[#e0e5ec] w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Analisis Detail Petugas</h3>
      <div className="mb-2 text-sm text-gray-500">Periode: {dateRange.start} s/d {dateRange.end}</div>
      <select onChange={(e) => handleSelectOfficer(parseInt(e.target.value))} className="input-neumorphic mb-6 w-full md:w-1/3">
        <option value="">-- Pilih Petugas --</option>
        {officersList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      {isLoading && <p className="text-center p-8">Memuat data petugas...</p>}
      {!selectedOfficerId && !isLoading && <p className="text-center p-8 text-gray-500">Silakan pilih seorang petugas untuk melihat detail kinerjanya.</p>}

      {officerData && !isLoading && (
        <div className="space-y-6">
          {/* KPI Petugas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <KpiCard title="Pendapatan Terkumpul" value={formatCurrency(parseFloat(officerData.kpi.total_revenue))} icon={<DollarSign />} />
            <KpiCard title="Total Transaksi" value={officerData.kpi.total_transactions.toString()} icon={<List />} />
            <KpiCard title="Pelanggan Dilayani" value={officerData.kpi.unique_customers_served.toString()} icon={<User />} />
            <KpiCard title="Wilayah Tugas" value={officerData.kpi.handled_areas} icon={<MapPin />} />
          </div>

          {/* Grafik Tren Pendapatan */}
          <NeumorphicCard className="p-6 rounded-2xl shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] bg-[#e0e5ec] w-full">
            <h4 className="font-semibold mb-4 flex items-center gap-2"><BarChart/> Tren Pendapatan Harian</h4>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <RechartsBarChart data={officerData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="daily_revenue" name="Pendapatan" fill="#8884d8" />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
          </NeumorphicCard>
        </div>
      )}
    </NeumorphicCard>
  );
};

// Komponen helper
const KpiCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <div className="bg-[#e0e5ec] p-4 rounded-xl text-center shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] w-full">
        <div className="flex items-center justify-center text-gray-500 text-sm mb-1">{icon} <span className="ml-2">{title}</span></div>
        <div className="text-xl font-bold text-gray-800 truncate">{value}</div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-lg">
        <p className="label">{`Tanggal : ${new Date(label ?? '').toLocaleDateString('id-ID')}`}</p>
        <p className="intro" style={{ color: payload[0].color }}>{`Pendapatan : ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};