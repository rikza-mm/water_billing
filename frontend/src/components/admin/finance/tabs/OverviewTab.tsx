import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, FileClock } from 'lucide-react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { IncomeStatement, CashFlowStatement, DailyData, BalanceSheet, FinancialRecord } from '@/hooks/admin/finance/useFinanceDashboard';

// PERBARUI Interface Props untuk menerima data baru
export interface OverviewTabProps {
  incomeStatement: IncomeStatement | null;
  cashFlowStatement: CashFlowStatement | null;
  balanceSheet: BalanceSheet | null; // Data Neraca
  dailyOverview: DailyData[];
  recentFinancials: FinancialRecord[]; // Data transaksi terbaru
}

export function OverviewTab({ 
  incomeStatement, 
  cashFlowStatement, 
  balanceSheet,
  dailyOverview = [], 
  recentFinancials = [] 
}: OverviewTabProps) {

  // ... (kode fallback jika data tidak ada tetap sama)
  if (!incomeStatement || !cashFlowStatement || !balanceSheet) {
    return (
      <NeumorphicCard>
        <div className="text-center py-8">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Data ringkasan tidak tersedia</p>
        </div>
      </NeumorphicCard>
    );
  }

  // Kalkulasi KPI dari Laba Rugi
  const totalPendapatan = incomeStatement.pendapatan_penjualan || 0;
  const totalBeban = (incomeStatement.total_hpp || 0) + (incomeStatement.total_biaya_operasional || 0);
  const labaBersih = incomeStatement.laba_bersih_sebelum_prive || 0;

  // Helper function to parse currency strings to numbers
  const parseAmount = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  // Kalkulasi KPI dari Neraca
  const totalAset = parseAmount(balanceSheet.aset.total_aset);
  const totalKewajiban = parseAmount(balanceSheet.kewajiban_dan_ekuitas.kewajiban.total_kewajiban);

  // Kalkulasi Arus Kas
  const operatingCashFlow = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'OPERATING') || { total_inflow: '0', total_outflow: '0' };
  const arusKasBersihOperasional = parseFloat(operatingCashFlow.total_inflow) - parseFloat(operatingCashFlow.total_outflow);
  const investingCashFlow = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'INVESTING') || { total_inflow: '0', total_outflow: '0' };
  const financingCashFlow = cashFlowStatement.summary?.find(s => s.cashflow_classification === 'FINANCING') || { total_inflow: '0', total_outflow: '0' };

  // Kalkulasi Rasio Keuangan
  const marginLabaBersih = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;
  const rasioKasOperasi = totalBeban > 0 ? (arusKasBersihOperasional / totalBeban) * 100 : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  // Komponen KPI Card konsisten dengan tab lain
  const KpiCard = ({ title, value, color, textColor, icon }: { title: string; value: number; color: string; textColor: string; icon: React.ReactNode }) => (
    <NeumorphicCard>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 ${color} rounded-full flex items-center justify-center`}>{icon}</div>
        <h4 className="font-semibold text-gray-700">{title}</h4>
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>{formatCurrency(value)}</p>
      <p className="text-xs text-gray-500 mt-1">Periode ini</p>
    </NeumorphicCard>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Utama (5 Kartu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard title="Total Pendapatan" value={totalPendapatan} color="bg-green-100" textColor="text-green-600" icon={<TrendingUp className="text-green-600" size={20} />} />
        <KpiCard title="Total Beban" value={totalBeban} color="bg-red-100" textColor="text-red-600" icon={<TrendingDown className="text-red-600" size={20} />} />
        <KpiCard title="Laba Bersih" value={labaBersih} color={labaBersih >= 0 ? "bg-green-100" : "bg-red-100"} textColor={labaBersih >= 0 ? "text-green-600" : "text-red-600"} icon={<DollarSign className={labaBersih >= 0 ? "text-green-600" : "text-red-600"} size={20} />} />
        <KpiCard title="Total Aset" value={totalAset} color="bg-blue-100" textColor="text-blue-600" icon={<BarChart3 className="text-blue-600" size={20} />} />
        <KpiCard title="Total Kewajiban" value={totalKewajiban} color="bg-orange-100" textColor="text-orange-600" icon={<Activity className="text-orange-600" size={20} />} />
      </div>

      {/* TAMBAHAN: Kartu Rasio Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeumorphicCard>
              <h4 className="font-semibold text-gray-700 mb-2">Margin Laba Bersih</h4>
              <p className={`text-2xl font-bold ${marginLabaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marginLabaBersih.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Efisiensi mengubah pendapatan menjadi laba.</p>
          </NeumorphicCard>
          <NeumorphicCard>
              <h4 className="font-semibold text-gray-700 mb-2">Rasio Kas Operasi</h4>
              <p className={`text-2xl font-bold ${rasioKasOperasi >= 100 ? 'text-green-600' : rasioKasOperasi > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {rasioKasOperasi.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Kemampuan membayar biaya operasional dari kas operasi.</p>
          </NeumorphicCard>
      </div>

      {/* Grafik Arus Kas Harian & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik (memakan 2/3 ruang) */}
        <div className="lg:col-span-2">
            <NeumorphicCard delay={0.4}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Grafik Arus Kas Harian</h3>
                </div>
            </div>

            {/* ... (Kode Body Grafik tidak berubah) ... */}
            <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
                <div className="h-64 flex items-end justify-between gap-2">
                    {dailyOverview && dailyOverview.length > 0 ? dailyOverview.map((day, index) => {
                      const maxValue = Math.max(...dailyOverview.map(d => Math.max(d.income, d.expense)));
                      const incomeHeight = maxValue > 0 ? (day.income / maxValue) * 100 : 0;
                      const expenseHeight = maxValue > 0 ? (day.expense / maxValue) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-300 hover:scale-105"
                            style={{ height: `${incomeHeight}%` }}
                            title={`Pemasukan: ${formatCurrency(day.income)}`}
                          />
                          <div
                            className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-md transition-all duration-300 hover:scale-105"
                            style={{ height: `${expenseHeight}%` }}
                            title={`Pengeluaran: ${formatCurrency(day.expense)}`}
                          />
                          <span className="text-xs text-gray-500 mt-2">
                            {formatDate(day.date)}
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="flex-1 text-center py-8">
                        <p className="text-gray-500 text-sm">Tidak ada data harian tersedia</p>
                      </div>
                    )}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Pemasukan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Pengeluaran</span>
                    </div>
                </div>
            </div>
            </NeumorphicCard>
        </div>

        {/* TAMBAHAN: Aktivitas Terbaru (memakan 1/3 ruang) */}
        <div className="lg:col-span-1">
            <NeumorphicCard delay={0.5}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                        <FileClock className="text-gray-600" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Aktivitas Terbaru</h3>
                </div>
                <div className="space-y-3">
                    {recentFinancials.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {tx.type === 'income' ? 
                                <TrendingUp className="text-green-600" size={16} /> :
                                <TrendingDown className="text-red-600" size={16} />
                                }
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">{tx.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                            </div>
                            <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                            </p>
                        </div>
                    ))}
                    {recentFinancials.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">Tidak ada transaksi terbaru.</p>
                    )}
                </div>
            </NeumorphicCard>
        </div>
      </div>

      {/* Ringkasan Arus Kas (tidak ada perubahan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Arus Kas Operasional */}
        <NeumorphicCard delay={0.5}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Activity className="text-blue-600" size={18} />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Arus Kas Operasional</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Masuk:</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(parseFloat(operatingCashFlow.total_inflow) || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Keluar:</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(parseFloat(operatingCashFlow.total_outflow) || 0)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-700">Bersih:</span>
                <span className={`text-sm font-bold ${
                  (parseFloat(operatingCashFlow.total_inflow) - parseFloat(operatingCashFlow.total_outflow)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(parseFloat(operatingCashFlow.total_inflow) - parseFloat(operatingCashFlow.total_outflow))}
                </span>
              </div>
            </div>
          </div>
        </NeumorphicCard>

        {/* Arus Kas Investasi */}
        <NeumorphicCard delay={0.6}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={18} />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Arus Kas Investasi</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Masuk:</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(parseFloat(investingCashFlow.total_inflow) || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Keluar:</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(parseFloat(investingCashFlow.total_outflow) || 0)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-700">Bersih:</span>
                <span className={`text-sm font-bold ${
                  (parseFloat(investingCashFlow.total_inflow) - parseFloat(investingCashFlow.total_outflow)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(parseFloat(investingCashFlow.total_inflow) - parseFloat(investingCashFlow.total_outflow))}
                </span>
              </div>
            </div>
          </div>
        </NeumorphicCard>

        {/* Arus Kas Pendanaan */}
        <NeumorphicCard delay={0.7}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="text-green-600" size={18} />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Arus Kas Pendanaan</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Masuk:</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(parseFloat(financingCashFlow.total_inflow) || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Keluar:</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(parseFloat(financingCashFlow.total_outflow) || 0)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-700">Bersih:</span>
                <span className={`text-sm font-bold ${
                  (parseFloat(financingCashFlow.total_inflow) - parseFloat(financingCashFlow.total_outflow)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(parseFloat(financingCashFlow.total_inflow) - parseFloat(financingCashFlow.total_outflow))}
                </span>
              </div>
            </div>
          </div>
        </NeumorphicCard>
      </div>
    </div>
  );
}