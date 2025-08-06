'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { NeumorphicCard } from '@/components/NeumorphicCard';

type Summary = {
  activeCustomers: number;
  inactiveCustomers: number;
};

export default function CustomerStatusPie({ summary }: { summary: Summary }) {
  const [chartData, setChartData] = useState([
    { name: 'Aktif', value: 0 },
    { name: 'Non-Aktif', value: 0 },
  ]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const COLORS = ['#6366F1', '#F59E0B']; // Indigo & Amber untuk konsistensi

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChartData([
        { name: 'Aktif', value: summary.activeCustomers },
        { name: 'Non-Aktif', value: summary.inactiveCustomers },
      ]);
    }, 400);
    return () => clearTimeout(timeout);
  }, [summary]);

  const totalCustomers = summary.activeCustomers + summary.inactiveCustomers;
  const getPercentage = (value: number) => ((value / totalCustomers) * 100).toFixed(1);

  return (
    <NeumorphicCard>
      <h2 className="text-lg font-semibold mb-6 text-gray-800">
        Distribusi Status Pelanggan
      </h2>

      <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
        <div className="relative w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                isAnimationActive={true}
                animationDuration={1000}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={COLORS[i % COLORS.length]}
                    stroke="#e0e5ec"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm font-medium text-gray-700">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Stats */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {totalCustomers}
            </p>
            <p className="text-sm text-gray-600">
              Total Pelanggan
            </p>
          </div>

          {/* Dynamic Tooltip */}
          {activeIndex !== null && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              bg-[#e0e5ec] px-4 py-2 rounded-xl
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              text-center min-w-[140px]"
            >
              <p className="text-sm font-medium text-gray-600">
                {chartData[activeIndex].name}
              </p>
              <p className="text-lg font-bold text-gray-800">
                {chartData[activeIndex].value}
              </p>
              <p className="text-xs text-gray-600">
                {getPercentage(chartData[activeIndex].value)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-[#e0e5ec] p-4 rounded-xl 
          shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
          hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
          transition-all duration-300"
        >
          <p className="text-sm text-gray-600 mb-1">Pelanggan Aktif</p>
          <p className="text-xl font-bold text-indigo-600">
            {summary.activeCustomers.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">
            {getPercentage(summary.activeCustomers)}% dari total
          </p>
        </div>
        <div className="bg-[#e0e5ec] p-4 rounded-xl 
          shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
          hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
          transition-all duration-300"
        >
          <p className="text-sm text-gray-600 mb-1">Pelanggan Non-Aktif</p>
          <p className="text-xl font-bold text-amber-600">
            {summary.inactiveCustomers.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">
            {getPercentage(summary.inactiveCustomers)}% dari total
          </p>
        </div>
      </div>
    </NeumorphicCard>
  );
}
