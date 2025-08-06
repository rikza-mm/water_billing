import { TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { CashFlowStatement, FinancialRecord } from '@/hooks/admin/finance/useFinanceDashboard';

// Interface untuk props komponen
export interface ArusKasTabProps {
  cashFlowStatement: CashFlowStatement | null;
  recentFinancials: FinancialRecord[]; // Diperlukan untuk tabel rincian
}

// Komponen Kartu KPI Arus Kas Bersih
const NetCashFlowCard = ({ title, value, icon, bgColor }: { title: string; value: number; icon: React.ReactNode; bgColor: string; }) => {
  const isPositive = value >= 0;
  return (
    <NeumorphicCard>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 ${bgColor} rounded-full`}>{icon}</div>
        <h4 className="font-semibold text-gray-700">{title}</h4>
      </div>
      <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(value)}
      </p>
      <p className="text-xs text-gray-500 mt-1">Arus kas bersih periode ini</p>
    </NeumorphicCard>
  );
};

// Komponen Utama Tab Arus Kas
export function ArusKasTab({ cashFlowStatement, recentFinancials = [] }: ArusKasTabProps) {
  
  if (!cashFlowStatement) {
    return (
      <NeumorphicCard>
        <div className="text-center py-8">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Data Arus Kas tidak tersedia.</p>
        </div>
      </NeumorphicCard>
    );
  }

  // Ekstrak data ringkasan untuk kemudahan
  const operating = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'OPERATING') || { total_inflow: '0', total_outflow: '0' };
  const investing = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'INVESTING') || { total_inflow: '0', total_outflow: '0' };
  const financing = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'FINANCING') || { total_inflow: '0', total_outflow: '0' };

  const netOperating = parseFloat(operating.total_inflow) - parseFloat(operating.total_outflow);
  const netInvesting = parseFloat(investing.total_inflow) - parseFloat(investing.total_outflow);
  const netFinancing = parseFloat(financing.total_inflow) - parseFloat(financing.total_outflow);
  const totalNetCashFlow = netOperating + netInvesting + netFinancing;

  return (
    <div className="space-y-8">
      {/* Bagian 1: KPI Utama Arus Kas Bersih */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NetCashFlowCard 
          title="Dari Operasional"
          value={netOperating}
          icon={<Activity size={20} className="text-blue-600"/>}
          bgColor="bg-blue-100"
        />
        <NetCashFlowCard 
          title="Dari Investasi"
          value={netInvesting}
          icon={<TrendingUp size={20} className="text-purple-600"/>}
          bgColor="bg-purple-100"
        />
        <NetCashFlowCard 
          title="Dari Pendanaan"
          value={netFinancing}
          icon={<DollarSign size={20} className="text-teal-600"/>}
          bgColor="bg-teal-100"
        />
        <NetCashFlowCard 
          title="Total Perubahan Kas"
          value={totalNetCashFlow}
          icon={<DollarSign size={20} className="text-green-600"/>}
          bgColor="bg-green-100"
        />
      </div>

      {/* Bagian 2: Laporan Rinci Arus Kas */}
      <NeumorphicCard className="w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Laporan Rinci Arus Kas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aktivitas Operasional */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
            <h4 className="font-semibold text-lg text-blue-700 mb-4 text-center">Aktivitas Operasional</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pemasukan</span>
                <span className="font-medium text-green-600">{formatCurrency(parseFloat(operating.total_inflow))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pengeluaran</span>
                <span className="font-medium text-red-600">({formatCurrency(parseFloat(operating.total_outflow))})</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Kas Bersih</span>
                  <span className={`font-bold ${netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netOperating)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aktivitas Investasi */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
            <h4 className="font-semibold text-lg text-purple-700 mb-4 text-center">Aktivitas Investasi</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pemasukan</span>
                <span className="font-medium text-green-600">{formatCurrency(parseFloat(investing.total_inflow))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pengeluaran</span>
                <span className="font-medium text-red-600">({formatCurrency(parseFloat(investing.total_outflow))})</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Kas Bersih</span>
                  <span className={`font-bold ${netInvesting >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netInvesting)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aktivitas Pendanaan */}
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
            <h4 className="font-semibold text-lg text-teal-700 mb-4 text-center">Aktivitas Pendanaan</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pemasukan</span>
                <span className="font-medium text-green-600">{formatCurrency(parseFloat(financing.total_inflow))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pengeluaran</span>
                <span className="font-medium text-red-600">({formatCurrency(parseFloat(financing.total_outflow))})</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Kas Bersih</span>
                  <span className={`font-bold ${netFinancing >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netFinancing)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NeumorphicCard>

      {/* Bagian 3: Rincian Transaksi Arus Kas */}
      <NeumorphicCard className="w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Rincian Transaksi Arus Kas</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentFinancials.length > 0 ? recentFinancials.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-4 bg-[#e0e5ec] rounded-xl shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
              <div>
                <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')} - <span className="font-semibold">{tx.cashflow_classification}</span></p>
              </div>
              <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}</p>
            </div>
          )) : <p className="text-sm text-gray-500 text-center py-4">Tidak ada transaksi pada periode ini.</p>}
        </div>
      </NeumorphicCard>
    </div>
  );
}