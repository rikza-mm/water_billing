import { useState } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { BalanceSheet, EquityTransaction, CustomerBalance } from '@/hooks/admin/finance/useFinanceDashboard';
import { Scale, TrendingUp, TrendingDown, Users, Plus } from 'lucide-react';
import { AddEquityTransactionModal } from '@/components/admin/finance/transactionsModal/AddEquityTransactionModal';

interface NeracaModalTabProps {
  balanceSheet: BalanceSheet;
  equityTransactions: EquityTransaction[];
  customers: CustomerBalance[];
  onAddEquityTransaction?: (data: {
    transaction_date: string;
    type: 'MODAL_AWAL' | 'SETORAN_MODAL' | 'PRIVE';
    amount: string;
    description: string;
  }) => Promise<void>;
}

export function NeracaModalTab({ balanceSheet, equityTransactions, onAddEquityTransaction }: NeracaModalTabProps) {
  const [isAddEquityModalOpen, setIsAddEquityModalOpen] = useState(false);

  const handleAddEquityTransaction = async (data: {
    type: 'SETORAN_MODAL' | 'PRIVE';
    amount: string;
    description: string;
    transaction_date: string;
  }) => {
    if (onAddEquityTransaction) {
      await onAddEquityTransaction({
        ...data,
        type: data.type as 'MODAL_AWAL' | 'SETORAN_MODAL' | 'PRIVE'
      });
      setIsAddEquityModalOpen(false);
    }
  };
  // Helper function to parse currency strings to numbers
  const parseAmount = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  // Kalkulasi untuk analisis komponen
  const totalAsetNum = parseAmount(balanceSheet.aset.total_aset);
  const kasNum = parseAmount(balanceSheet.aset.aset_lancar.kas_dan_bank);
  const piutangNum = parseAmount(balanceSheet.aset.aset_lancar.piutang_usaha);
  const asetLancarNum = kasNum + piutangNum;
  const asetTetapNum = parseAmount(balanceSheet.aset.aset_tetap.peralatan_dan_inventaris);
  
  const totalLiabilitasEkuitasNum = balanceSheet.kewajiban_dan_ekuitas.total_kewajiban_dan_ekuitas;
  const kewajibanNum = parseAmount(balanceSheet.kewajiban_dan_ekuitas.kewajiban.total_kewajiban);
  const ekuitasNum = parseAmount(balanceSheet.kewajiban_dan_ekuitas.ekuitas.modal_akhir);

  const persenAsetLancar = totalAsetNum > 0 ? (asetLancarNum / totalAsetNum) * 100 : 0;
  const persenAsetTetap = totalAsetNum > 0 ? (asetTetapNum / totalAsetNum) * 100 : 0;
  const persenKewajiban = totalLiabilitasEkuitasNum > 0 ? (kewajibanNum / totalLiabilitasEkuitasNum) * 100 : 0;
  const persenEkuitas = totalLiabilitasEkuitasNum > 0 ? (ekuitasNum / totalLiabilitasEkuitasNum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Status Neraca */}
      <NeumorphicCard delay={0.1}>
        <div className="text-center py-4">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
            balanceSheet.status === 'SEIMBANG' 
              ? 'bg-green-100 text-green-700 border-2 border-green-300' 
              : 'bg-red-100 text-red-700 border-2 border-red-300'
          }`}>
            <Scale size={24} />
            {balanceSheet.status === 'SEIMBANG' ? '✅ SEIMBANG' : '❌ TIDAK SEIMBANG'}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Status Neraca per {new Date(balanceSheet.periode).toLocaleDateString('id-ID')}
          </p>
        </div>
      </NeumorphicCard>

      {/* Laporan Neraca */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sisi Kiri - Aset */}
        <NeumorphicCard delay={0.2}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            ASET
          </h3>
          
          <div className="space-y-4">
            {/* Aset Lancar */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-3">Aset Lancar</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kas dan Bank</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(kasNum)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Piutang Usaha</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(piutangNum)}
                  </span>
                </div>
              </div>
            </div>

            {/* Aset Tetap */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Aset Tetap</h4>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Peralatan dan Inventaris</span>
                <span className="font-semibold text-blue-700">
                  {formatCurrency(asetTetapNum)}
                </span>
              </div>
            </div>

            {/* Total Aset */}
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL ASET</span>
                <span className="text-xl font-bold text-gray-800">
                  {formatCurrency(totalAsetNum)}
                </span>
              </div>
            </div>

            {/* Analisis Komponen Aset */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 text-sm">Analisis Komponen Aset</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Aset Lancar:</span>
                  <span className="font-semibold text-green-600">{persenAsetLancar.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Aset Tetap:</span>
                  <span className="font-semibold text-blue-600">{persenAsetTetap.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </NeumorphicCard>

        {/* Sisi Kanan - Kewajiban & Ekuitas */}
        <NeumorphicCard delay={0.3}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-600" size={20} />
            KEWAJIBAN & EKUITAS
          </h3>
          
          <div className="space-y-4">
            {/* Kewajiban */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-3">Kewajiban</h4>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Kewajiban</span>
                <span className="font-semibold text-red-700">
                  {formatCurrency(kewajibanNum)}
                </span>
              </div>
            </div>

            {/* Ekuitas */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">Ekuitas</h4>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Modal Akhir</span>
                <span className="font-semibold text-purple-700">
                  {formatCurrency(ekuitasNum)}
                </span>
              </div>
            </div>

            {/* Total Kewajiban & Ekuitas */}
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL KEWAJIBAN & EKUITAS</span>
                <span className="text-xl font-bold text-gray-800">
                  {formatCurrency(totalLiabilitasEkuitasNum)}
                </span>
              </div>
            </div>

            {/* Analisis Komponen Kewajiban & Ekuitas */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 text-sm">Analisis Komponen</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Kewajiban:</span>
                  <span className="font-semibold text-red-600">{persenKewajiban.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Ekuitas (Modal):</span>
                  <span className="font-semibold text-purple-600">{persenEkuitas.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </NeumorphicCard>
      </div>

      {/* Tabel Rincian Transaksi Modal */}
      <NeumorphicCard delay={0.4}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Users className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Rincian Transaksi Modal</h3>
          </div>
          {onAddEquityTransaction && (
            <button
              onClick={() => setIsAddEquityModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
            >
              <Plus size={16} />
              Tambah Modal
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {equityTransactions.length > 0 ? equityTransactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center p-4 bg-[#e0e5ec] rounded-xl shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
              <div>
                <p className="text-sm font-medium text-gray-700">{transaction.description}</p>
                <p className="text-xs text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString('id-ID')} - <span className="font-semibold">{transaction.type.replace('_', ' ')}</span></p>
              </div>
              <p className={`text-sm font-bold ${transaction.type === 'PRIVE' ? 'text-red-600' : 'text-green-600'}`}>{transaction.type === 'PRIVE' ? '-' : '+'}{formatCurrency(transaction.amount)}</p>
            </div>
          )) : (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada transaksi modal pada periode ini</p>
          )}
        </div>
      </NeumorphicCard>

      {/* Add Equity Transaction Modal */}
      <AddEquityTransactionModal
        isOpen={isAddEquityModalOpen}
        onClose={() => setIsAddEquityModalOpen(false)}
        onSubmit={handleAddEquityTransaction}
      />
    </div>
  );
}