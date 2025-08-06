'use client';

import { User, Users, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

type Summary = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalUnpaidBills: number;
  incomeToday: number;
  incomeThisWeek: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
};

export default function StatCards({ summary }: { summary: Summary }) {
  const cards = [
    {
      title: 'Total Pelanggan',
      value: summary.totalCustomers.toLocaleString(),
      change: '+5.2%',
      changeColor: 'text-green-600',
      icon: <Users className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Pelanggan Aktif',
      value: summary.activeCustomers.toLocaleString(),
      change: '+4.1%',
      changeColor: 'text-green-600',
      icon: <User className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Pelanggan Non-Aktif',
      value: summary.inactiveCustomers.toLocaleString(),
      change: '-1.2%',
      changeColor: 'text-red-500',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    },
    {
      title: 'Tagihan Belum Lunas',
      value: summary.totalUnpaidBills.toLocaleString(),
      change: '-2.1%',
      changeColor: 'text-red-500',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
    },
    {
      title: 'Pemasukan Hari Ini',
      value: `Rp ${summary.incomeToday.toLocaleString()}`,
      change: '+0.0%',
      changeColor: 'text-gray-400',
      icon: <DollarSign className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Pemasukan Minggu Ini',
      value: `Rp ${summary.incomeThisWeek.toLocaleString()}`,
      change: '+0.0%',
      changeColor: 'text-gray-400',
      icon: <DollarSign className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: `Rp ${summary.incomeThisMonth.toLocaleString()}`,
      change: '+3.8%',
      changeColor: 'text-green-600',
      icon: <DollarSign className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Pengeluaran Bulan Ini',
      value: `Rp ${summary.expenseThisMonth.toLocaleString()}`,
      change: '+1.5%',
      changeColor: 'text-green-600',
      icon: <TrendingUp className="w-4 h-4 text-indigo-600" />,
    },
  ];

  return (
    <div className="bg-[#e0e5ec] rounded-2xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-[#e0e5ec] rounded-xl p-4 
              shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
              hover:shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-[#e0e5ec] p-2 rounded-lg 
                shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] 
                text-gray-800 text-center"
              >
                {card.icon}
              </div>
              <span className={`${card.changeColor} text-sm font-medium`}>
                {card.change}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
