'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CustomersByArea } from '@/hooks/admin/dashboard/useAdminDashboard';

export default function StatistikPelangganPerWilayah({ data }: { data: CustomersByArea[] }) {
  return (
    <div className="bg-[#e0e5ec] rounded-2xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Statistik Jumlah Pelanggan per Wilayah</h2>
      
      <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis 
              dataKey="wilayah" 
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#9CA3AF' }}
            />
            <YAxis 
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#e0e5ec',
                border: 'none',
                borderRadius: '0.75rem',
                boxShadow: '4px 4px 8px #bebebe, -4px -4px 8px #ffffff'
              }}
            />
            <Bar 
              dataKey="jumlah" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity duration-300"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
        {data.map((item, index) => (
          <div 
            key={index}
            className="bg-[#e0e5ec] p-3 rounded-xl 
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
              transition-all duration-300"
          >
            <p className="text-sm font-medium text-gray-600">{item.wilayah}</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{item.jumlah}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
