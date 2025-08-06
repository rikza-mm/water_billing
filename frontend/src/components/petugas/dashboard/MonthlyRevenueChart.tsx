'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ChartOptions, TooltipItem
} from 'chart.js';
import { ArrowUp, ArrowDown } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// [DIUBAH] Interface Props diperbarui untuk menerima revenueCard
interface MonthlyRevenueChartProps {
  data: {
    labels: string[];
    series: { name: string; data: number[] }[];
    summary: {
      totalRevenue: number;
      monthlyAverage: number;
    };
  };
  revenueCard: {
    percentageChange: number;
    changeType: 'increase' | 'decrease';
  };
}

export default function MonthlyRevenueChart({
  data,
  revenueCard
}: MonthlyRevenueChartProps) {
  if (!data || !Array.isArray(data.series) || !Array.isArray(data.labels) || data.series.length === 0) {
    return <div className="text-center text-gray-500 py-8">Data grafik belum tersedia.</div>;
  }

  // [DIHAPUS] Perhitungan persentase lokal dihapus
  // const currentRevenue = ...
  // const previousRevenue = ...
  // const percentageChange = ...

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: data.series[0]?.name || 'Pendapatan',
        data: data.series[0]?.data || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        titleFont: { family: 'var(--font-poppins)', size: 13, weight: 600 },
        bodyFont: { family: 'var(--font-nunito)', size: 12 },
        padding: 12,
        borderColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function(tooltipItem: TooltipItem<'line'>) {
            let label = tooltipItem.dataset.label || '';
            if (label) { label += ': '; }
            if (tooltipItem.parsed.y !== null) { label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tooltipItem.parsed.y); }
            return label;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'var(--font-nunito)', size: 11, weight: 500 }, padding: 8, color: '#64748b' }, border: { display: false } },
      y: { display: false, grid: { color: 'rgba(226, 232, 240, 0.6)' }, border: { display: false } }
    },
    layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
  };

  return (
    <div className="bg-[#e0e5ec] rounded-2xl p-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 font-poppins">Grafik Pendapatan</h2>
          <div className="flex items-center bg-[#e0e5ec] rounded-xl px-3 py-1.5 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
            <span className={`text-sm font-medium ${revenueCard.changeType === 'increase' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {revenueCard.changeType === 'increase' ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
              {Math.abs(revenueCard.percentageChange).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-2">vs bulan lalu</span>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#e0e5ec] rounded-xl p-2 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
          <div className="h-[180px] sm:h-[240px]">
            <Line data={chartData} options={options} />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
            <p className="text-xs text-gray-500 font-nunito mb-1">Total Pendapatan</p>
            <p className="text-base font-semibold text-gray-800 font-poppins">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.summary.totalRevenue)}
            </p>
          </div>
          <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_2px_2px_8px_#bebebe,inset_-2px_-2px_8px_#ffffff]">
            <p className="text-xs text-gray-500 font-nunito mb-1">Rata-rata Bulanan</p>
            <p className="text-base font-semibold text-gray-800 font-poppins">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.summary.monthlyAverage)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}