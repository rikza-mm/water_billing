'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePetugasDashboard } from '@/hooks/petugas/dashboard/usePetugasDashboard';
import { Loader2 } from 'lucide-react';

// ✅ Dynamic import modul besar
const RevenueStats = dynamic(() => import('@/components/petugas/dashboard/RevenueStats'), {
  loading: () => <p>Memuat statistik...</p>,
  ssr: false,
});
const MonthlyRevenueChart = dynamic(() => import('@/components/petugas/dashboard/MonthlyRevenueChart'), {
  loading: () => <p>Memuat grafik...</p>,
  ssr: false,
});

export default function PetugasDashboardPage() {
  const {
    loading,
    revenueCard,
    kpiCards,
    revenueChart,
  } = usePetugasDashboard();

  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallScreen: false
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isSmallScreen: window.innerWidth < 640
      });
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isSmallScreen } = screenSize;

  const mappedRevenueCard = {
    currentMonthRevenue: revenueCard.currentMonthRevenue,
    percentageChange: revenueCard.percentageChange,
    changeType:
      revenueCard.changeType === 'increase' || revenueCard.changeType === 'decrease'
        ? revenueCard.changeType
        : revenueCard.percentageChange >= 0
        ? 'increase'
        : 'decrease',
  };

  const mappedKpiCards = kpiCards;


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300 ease-in-out">
      {/* Revenue Stats Section */}
      <div className="bg-[#e0e5ec] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] sm:shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] transition-all duration-300">
        <h2 className={`font-poppins ${isSmallScreen ? 'text-xl' : 'text-2xl'} font-semibold text-gray-800 mb-4 sm:mb-6`}>
          Statistik Pendapatan
        </h2>
        <RevenueStats revenueCard={mappedRevenueCard} kpiCards={mappedKpiCards} />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-[#e0e5ec] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] sm:shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] transition-all duration-300">
        <MonthlyRevenueChart
          data={revenueChart}
          revenueCard={{
            percentageChange: mappedRevenueCard.percentageChange,
            changeType: mappedRevenueCard.changeType,
          }}
        />
      </div>
    </div>
  );
}
