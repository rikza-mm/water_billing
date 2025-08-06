import { FileText } from 'lucide-react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { IncomeStatement, FinancialRecord } from '@/hooks/admin/finance/useFinanceDashboard';

// Interface untuk props komponen
export interface LabaRugiTabProps {
  incomeStatement: IncomeStatement | null;
  recentFinancials: FinancialRecord[]; // Diperlukan untuk tabel rincian
}

// Komponen untuk kartu KPI
const KpiCard = ({ title, value, isPositive }: { title: string; value: number; isPositive: boolean }) => (
  <NeumorphicCard>
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 ${isPositive ? 'bg-green-100' : 'bg-red-100'} rounded-full`}>
        {/* Ikon dinamis sesuai status */}
        {isPositive ? <FileText size={20} className="text-green-600" /> : <FileText size={20} className="text-red-600" />}
      </div>
      <h4 className="font-semibold text-gray-700">{title}</h4>
    </div>
    <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(value)}</p>
    <p className="text-xs text-gray-500 mt-1">{isPositive ? 'Nilai positif periode ini' : 'Nilai negatif periode ini'}</p>
  </NeumorphicCard>
);

// Komponen untuk Waterfall Chart
const WaterfallChart = ({ data }: { data: IncomeStatement }) => {
  const items = [
    { label: 'Pendapatan', value: data.pendapatan_penjualan, type: 'positive' },
    { label: 'HPP', value: -data.total_hpp, type: 'negative' },
    { label: 'Biaya Operasional', value: -data.total_biaya_operasional, type: 'negative' },
    { label: 'Prive', value: -data.prive_pemilik, type: 'negative' },
  ];

  let cumulative = 0;
  const chartData = items.map(item => {
    const start = cumulative;
    cumulative += item.value;
    const end = cumulative;
    return { ...item, start, end };
  });

  const totalRange = Math.max(...chartData.map(d => Math.abs(d.start)), ...chartData.map(d => Math.abs(d.end)), data.pendapatan_penjualan);

  return (
    <NeumorphicCard>
        <h3 className="text-xl font-bold text-gray-800 mb-6">Visualisasi Laba Rugi (Waterfall)</h3>
        <div className="space-y-4">
            {chartData.map((item, index) => {
                const isPositive = item.value >= 0;
                const topPosition = totalRange > 0 ? ((totalRange - Math.max(item.start, item.end)) / (totalRange * 1.2)) * 100 : 0;
                const height = totalRange > 0 ? (Math.abs(item.value) / (totalRange * 1.2)) * 100 : 0;

                return(
                    <div key={index} className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 text-right">{item.label}</span>
                        <div className="flex-1 bg-gray-100 rounded h-8 relative">
                           <div
                             className={`absolute rounded transition-all duration-500 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                             style={{
                                 top: `${topPosition}%`,
                                 height: `${height}%`,
                                 width: '100%'
                             }}
                             title={formatCurrency(item.value)}
                           ></div>
                        </div>
                        <span className={`w-32 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(item.value)}</span>
                    </div>
                );
            })}
             <div className="flex items-center gap-4 pt-4 border-t">
                <span className="w-40 text-sm font-bold text-gray-800 text-right">Laba Bersih</span>
                <div className="flex-1"></div>
                <span className={`w-32 text-lg font-bold ${data.laba_bersih_sebelum_prive >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(data.laba_bersih_sebelum_prive)}
                </span>
            </div>
        </div>
    </NeumorphicCard>
  )
}

// Komponen Utama Tab Laba Rugi
export function LabaRugiTab({ incomeStatement, recentFinancials = [] }: LabaRugiTabProps) {
  if (!incomeStatement) {
    return (
      <NeumorphicCard>
        <div className="text-center py-8">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Data Laba Rugi tidak tersedia.</p>
        </div>
      </NeumorphicCard>
    );
  }

  // Filter transaksi untuk tabel rincian
  const pendapatanTransactions = recentFinancials.filter(t => t.type === 'income' && (t.cashflow_classification === 'OPERATING' || t.cashflow_classification === 'INVESTING'));
  const bebanTransactions = recentFinancials.filter(t => t.type === 'expense' && t.cashflow_classification === 'OPERATING');

  return (
    <div className="space-y-8">
      {/* Bagian 1: KPI Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard title="Pendapatan Penjualan" value={incomeStatement.pendapatan_penjualan} isPositive={true} />
        <KpiCard title="Total HPP" value={incomeStatement.total_hpp} isPositive={false} />
        <KpiCard title="Laba Kotor" value={incomeStatement.laba_kotor} isPositive={incomeStatement.laba_kotor >= 0} />
        <KpiCard title="Biaya Operasional" value={incomeStatement.total_biaya_operasional} isPositive={false} />
        <KpiCard title="Laba Operasional" value={incomeStatement.laba_operasional} isPositive={incomeStatement.laba_operasional >= 0} />
      </div>

      {/* Bagian 2: Waterfall Chart */}
      <WaterfallChart data={incomeStatement} />
      {/* Bagian 3: Tabel Rincian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rincian Pendapatan */}
        <NeumorphicCard className="w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Rincian Pendapatan</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendapatanTransactions.length > 0 ? pendapatanTransactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 bg-[#e0e5ec] rounded-xl shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
                <div>
                  <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(tx.amount)}</p>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">Tidak ada rincian pendapatan.</p>}
          </div>
        </NeumorphicCard>
        {/* Rincian Beban */}
        <NeumorphicCard className="w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Rincian Beban (HPP & Operasional)</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bebanTransactions.length > 0 ? bebanTransactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 bg-[#e0e5ec] rounded-xl shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
                <div>
                  <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                </div>
                <p className="text-sm font-semibold text-red-600">{formatCurrency(tx.amount)}</p>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">Tidak ada rincian beban.</p>}
          </div>
        </NeumorphicCard>
      </div>
    </div>
  );
}