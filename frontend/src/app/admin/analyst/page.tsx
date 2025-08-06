"use client";

import { useState, useEffect } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { useAnalystDashboard } from '@/hooks/admin/analyst/useAnalystDashboard';
import { Calendar, RefreshCw, BarChart, Users, UserCheck, Droplets } from 'lucide-react';

// Impor komponen-komponen Tab
import { AnalystOverviewTab } from '@/components/admin/analyst/tabs/AnalystOverviewTab';
import { OfficerDetailTab } from '@/components/admin/analyst/tabs/OfficerDetailTab';
import { CustomerDetailTab } from '@/components/admin/analyst/tabs/CustomerDetailTab';
import { WaterUsageTab } from '@/components/admin/analyst/tabs/WaterUsageTab';

export default function AnalystDashboardPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'officer_detail' | 'customer_detail' | 'water_usage'>('overview');

  // State untuk menampung semua petugas (untuk dropdown)
  const [officersList, setOfficersList] = useState<{ id: number; name: string; }[]>([]);

  const { data, isLoading, error, refreshData, fetchOfficerDetail, fetchCustomerLedger } = useAnalystDashboard({ dateRange });

  // Ambil daftar petugas dari data utama saat tersedia
  useEffect(() => {
    if (data?.officerLeaderboard) {
      const list = data.officerLeaderboard.map(o => ({ id: o.officer_id, name: o.officer_name }));
      setOfficersList(list);
    }
  }, [data]);

  const renderTabContent = () => {
    if (isLoading && !data) {
      return <div className="text-center py-12">...Loading...</div>;
    }
    if (error) {
      return <NeumorphicCard>...</NeumorphicCard>;
    }
    if (!data) return null;

    switch(activeTab) {
      case 'overview':
        return (
          <AnalystOverviewTab 
            summary={data.overallSummary}
            officers={data.officerLeaderboard}
            areas={data.areaPerformance}
            lists={data.customerActionLists}
          />
        );
      case 'officer_detail':
        return (
          <OfficerDetailTab 
            dateRange={dateRange}
            fetchOfficerDetail={fetchOfficerDetail}
            officersList={officersList}
          />
        );
      case 'customer_detail':
        return (
          <CustomerDetailTab
            fetchCustomerLedger={fetchCustomerLedger}
          />
        );
      case 'water_usage':
        return <WaterUsageTab dateRange={dateRange} />;
      default:
        return null;
    }
  };


  return (
    <main className="p-6 space-y-6 bg-[#e0e5ec] min-h-screen">
      {/* Header */}
      <NeumorphicCard>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><BarChart /> Dasbor Analis Kinerja</h1>
            <p className="text-gray-600">Analisis kinerja petugas dan kesehatan penagihan pelanggan.</p>
          </div>
           <button onClick={refreshData} disabled={isLoading} className="button-neumorphic-primary flex items-center gap-2">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh Data
           </button>
        </div>
      </NeumorphicCard>

      {/* Filter Tanggal */}
      <NeumorphicCard>
        <div className="flex items-center gap-4">
          <Calendar size={18} /><span>Filter Periode:</span>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="input-neumorphic" />
          <span>-</span>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="input-neumorphic" />
        </div>
      </NeumorphicCard>

      {/* Navigasi Tab */}
       <NeumorphicCard>
        <div className="flex gap-2">
          <TabButton
            label="Ringkasan Kinerja"
            icon={<BarChart size={18} />}
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            label="Detail Petugas"
            icon={<UserCheck size={18} />}
            isActive={activeTab === 'officer_detail'}
            onClick={() => setActiveTab('officer_detail')}
          />
           <TabButton
            label="Detail Pelanggan"
            icon={<Users size={18} />}
            isActive={activeTab === 'customer_detail'}
            onClick={() => setActiveTab('customer_detail')}
          />
          <TabButton
            label="Analisis Pemakaian"
            icon={<Droplets size={18} />}
            isActive={activeTab === 'water_usage'}
            onClick={() => setActiveTab('water_usage')}
          />
        </div>
      </NeumorphicCard>
      
      {/* Konten Tab */}
      <div>
        {renderTabContent()}
      </div>
    </main>
  );
}

// Komponen helper untuk tombol tab
const TabButton = ({ label, icon, isActive, onClick }: { label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
      isActive
        ? 'bg-blue-500 text-white shadow-lg transform scale-105'
        : 'bg-[#e0e5ec] text-gray-700 hover:bg-gray-200 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff]'
    }`}
  >
    {icon} {label}
  </button>
);