'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  Area,
} from 'recharts'
import { useEffect, useState } from 'react';

import { NeumorphicCard } from '@/components/NeumorphicCard'

export default function IncomeExpenseChart({ trendData }: { trendData: { month: string; pemasukan: string; pengeluaran: string; }[] }) {
  const [chartData, setChartData] = useState(trendData || []);

  useEffect(() => {
    setChartData(trendData || []);
  }, [trendData]);

  return (
    <NeumorphicCard className="bg-[#e0e5ec] rounded-2xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">
          Grafik Pemasukan vs Pengeluaran
        </h2>

        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
          <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#9CA3AF"
              opacity={0.5}
            />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#9CA3AF' }}
            />
            <YAxis 
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#9CA3AF' }}
              tickFormatter={(value) => value.toLocaleString('id-ID')}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#e0e5ec',
                border: 'none',
                borderRadius: '0.75rem',
                boxShadow: '4px 4px 8px #bebebe, -4px -4px 8px #ffffff',
                padding: '12px'
              }}
              itemStyle={{
                color: '#4B5563'
              }}
              labelStyle={{
                color: '#374151',
                fontWeight: '600',
                marginBottom: '4px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px'
              }}
              formatter={(value) => (
                <span className="text-gray-700 text-sm font-medium">{value}</span>
              )}
            />

            <Area
              type="monotone"
              dataKey="pemasukan"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.08}
              isAnimationActive={true}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="pengeluaran"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.08}
              isAnimationActive={true}
              animationDuration={1000}
            />

            <Line
              type="monotone"
              dataKey="pemasukan"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ 
                r: 4,
                fill: '#e0e5ec',
                stroke: '#6366F1',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: '#6366F1',
                stroke: '#e0e5ec',
                strokeWidth: 2
              }}
              isAnimationActive={true}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="pengeluaran"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ 
                r: 4,
                fill: '#e0e5ec',
                stroke: '#10B981',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: '#10B981',
                stroke: '#e0e5ec',
                strokeWidth: 2
              }}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
            <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
            <p className="text-xl font-bold text-indigo-600">
            Rp {chartData.reduce((sum: number, item) => sum + Number(item.pemasukan), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
          <p className="text-xl font-bold text-emerald-600">
            Rp {chartData.reduce((sum: number, item) => sum + Number(item.pengeluaran), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </NeumorphicCard>
  )
}
