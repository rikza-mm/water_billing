"use client";

import { NeumorphicCard } from '@/components/NeumorphicCard';
import { useWaterUsageDashboard, WaterUsageDashboardData } from '@/hooks/admin/analyst/useWaterUsageDashboard';
import type { CustomerUsageEntry } from '@/hooks/admin/analyst/useWaterUsageDashboard';
import { formatCurrency } from '@/lib/utils';
import { Droplets, Users, TrendingUp, UserCheck, Map, AlertTriangle } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  // Komponen ini akan mengelola pengambilan datanya sendiri
  dateRange: { start: string; end: string; };
}

export const WaterUsageTab = ({ dateRange }: Props) => {
  const { data, isLoading, error } = useWaterUsageDashboard({ dateRange });

  if (isLoading) return <p className="text-center p-8">Menganalisis data pemakaian air...</p>;
  if (error) return <p className="text-center p-8 text-red-500">{error}</p>;
  if (!data) return <p className="text-center p-8 text-gray-500">Data tidak tersedia.</p>;

  return (
    <div className="space-y-6">
      {/* Bagian 1: Ringkasan & Tren */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageSummaryKpis summary={data.usageSummary} />
        <MonthlyUsageChart trend={data.monthlyUsageTrend} />
      </div>

      {/* Bagian 2: Analisis per Wilayah */}
      <UsageByAreaTable areas={data.usageByArea} />
      
      {/* Bagian 3: Analisis per Pelanggan */}
      <CustomerUsageTables analysis={data.customerUsageAnalysis} />
    </div>
  );
};

// =======================================================================
// KOMPONEN-KOMPONEN ANAK (CHILD COMPONENTS)
// =======================================================================

const UsageSummaryKpis = ({ summary }: { summary: WaterUsageDashboardData['usageSummary'] }) => (
    <NeumorphicCard className="h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Umum Pemakaian</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Total Pemakaian" value={`${parseFloat(summary.totalUsageM3).toLocaleString('id-ID')} m³`} icon={<Droplets />} />
            <KpiCard title="Rata-rata / Pelanggan" value={`${summary.avgUsagePerCustomer.toFixed(2)} m³`} icon={<Users />} />
            <KpiCard title="Pendapatan / m³" value={formatCurrency(summary.revenuePerM3)} icon={<TrendingUp />} />
            <KpiCard title="Pemakai Tertinggi" value={summary.topConsumer?.full_name || '-'} icon={<UserCheck />} />
        </div>
    </NeumorphicCard>
);

const MonthlyUsageChart = ({ trend }: { trend: WaterUsageDashboardData['monthlyUsageTrend'] }) => (
    <NeumorphicCard className="h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Pemakaian Bulanan (m³)</h3>
        <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
                <RechartsBarChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('id-ID')} m³`} />
                    <Bar dataKey="totalUsageM3" name="Total Pemakaian" fill="#3B82F6" radius={[8,8,0,0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    </NeumorphicCard>
);

const UsageByAreaTable = ({ areas }: { areas: WaterUsageDashboardData['usageByArea'] }) => (
    <NeumorphicCard className="h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Map/> Analisis per Wilayah</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        <th className="p-2">Nama Wilayah</th>
                        <th className="p-2 text-right">Total Pemakaian (m³)</th>
                        <th className="p-2 text-right">Jml. Pelanggan</th>
                        <th className="p-2 text-right">Rata-rata / Pelanggan (m³)</th>
                        <th className="p-2 text-right">Total Pendapatan</th>
                    </tr>
                </thead>
                <tbody>
                    {areas.map(area => (
                        <tr key={area.area_name} className="border-b">
                            <td className="p-2 font-semibold">{area.area_name}</td>
                            <td className="p-2 text-right">{parseFloat(area.totalUsageM3).toLocaleString('id-ID')}</td>
                            <td className="p-2 text-right">{area.customerCount}</td>
                            <td className="p-2 text-right">{area.avgUsagePerCustomer.toFixed(2)}</td>
                            <td className="p-2 text-right text-green-600 font-semibold">{formatCurrency(parseFloat(area.totalRevenue))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </NeumorphicCard>
);

const CustomerUsageTables = ({ analysis }: { analysis: WaterUsageDashboardData['customerUsageAnalysis'] }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeumorphicCard className="h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="text-green-500"/> Pelanggan Pemakaian Tertinggi</h3>
            <CustomerUsageTable customers={analysis.topUsageCustomers} />
        </NeumorphicCard>
        <NeumorphicCard className="h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500"/> Pelanggan Pemakaian Terendah</h3>
            <CustomerUsageTable customers={analysis.lowUsageCustomers} />
        </NeumorphicCard>
    </div>
);

const CustomerUsageTable = ({ customers }: { customers: CustomerUsageEntry[] }) => (
    <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="p-2">Nama</th><th className="p-2">Wilayah</th><th className="p-2 text-right">Pemakaian (m³)</th></tr></thead>
            <tbody>
                {customers.map(c => (
                    <tr key={c.customer_id} className="border-b">
                        <td className="p-2">{c.full_name}</td>
                        <td className="p-2 text-gray-600">{c.area_name}</td>
                        <td className="p-2 text-right font-semibold">{parseFloat(c.waterUsageM3).toLocaleString('id-ID')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const KpiCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-[#e0e5ec] p-4 rounded-xl text-center shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] w-full flex flex-col items-center justify-center gap-1">
    <div className="flex items-center text-gray-500 text-xs mb-1">{icon} <span className="ml-2">{title}</span></div>
    <div className="text-xl font-bold text-gray-800">{value}</div>
  </div>
);