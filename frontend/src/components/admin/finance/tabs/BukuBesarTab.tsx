import { useState, useMemo } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { formatCurrency } from '@/lib/utils';
import { FinancialRecord } from '@/hooks/admin/finance/useFinanceDashboard';
import { Search, Filter, FileText } from 'lucide-react';

interface BukuBesarTabProps {
  recentFinancials: FinancialRecord[];
  dateRange: {
    start: string;
    end: string;
  };
}

export function BukuBesarTab({ recentFinancials, dateRange }: BukuBesarTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredTransactions = useMemo(() => {
    return recentFinancials.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [recentFinancials, searchTerm, filterType, filterCategory]);

  const uniqueCategories = [...new Set(recentFinancials.map(t => t.category).filter(Boolean))];
  
  // =======================================================================
  // === PERBAIKAN LOGIKA KALKULASI DI SINI ===
  // =======================================================================
  
  // Kalkulasi total berdasarkan SEMUA data yang relevan, bukan hanya yang difilter untuk tampilan
  const totalPemasukan = useMemo(() => 
    recentFinancials
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : Number(t.amount)), 0),
    [recentFinancials]
  );
  
  const totalPengeluaran = useMemo(() =>
    recentFinancials
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [recentFinancials]
  );

  const selisihBersih = totalPemasukan - totalPengeluaran;

  return (
    <div className="space-y-6">
      {/* Header dengan Filter & Pencarian */}
      <NeumorphicCard className="rounded-2xl p-6 shadow-[4px_4px_12px_#bebebe,-4px_-4px_12px_#ffffff] bg-[#e0e5ec] w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <FileText className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Buku Besar Transaksi</h3>
          <span className="text-sm text-gray-500 ml-auto">
            Periode: {new Date(dateRange.start).toLocaleDateString('id-ID')} - {new Date(dateRange.end).toLocaleDateString('id-ID')}
          </span>
        </div>

        {/* Filter & Pencarian */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Pencarian */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari deskripsi atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_3px_3px_7px_#bebebe,inset_-3px_-3px_7px_#ffffff] transition-all"
            />
          </div>

          {/* Filter Tipe */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_3px_3px_7px_#bebebe,inset_-3px_-3px_7px_#ffffff] transition-all appearance-none"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_3px_3px_7px_#bebebe,inset_-3px_-3px_7px_#ffffff] transition-all appearance-none"
            >
              <option value="all">Semua Kategori</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category?.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterCategory('all');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
          >
            Reset Filter
          </button>
        </div>

        {/* Info Hasil */}
        <div className="mt-4 text-sm text-gray-600">
          Menampilkan {filteredTransactions.length} dari {recentFinancials.length} transaksi
        </div>
      </NeumorphicCard>

      {/* Tabel Transaksi */}
      <NeumorphicCard className="rounded-2xl p-6 shadow-[4px_4px_12px_#bebebe,-4px_-4px_12px_#ffffff] bg-[#e0e5ec] w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Daftar Transaksi</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-4 bg-[#e0e5ec] rounded-xl shadow-[2px_2px_8px_#bebebe,-2px_-2px_8px_#ffffff]">
              <div>
                <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')} - <span className="font-semibold">{tx.cashflow_classification}</span></p>
              </div>
              <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}</p>
            </div>
          )) : (
            <p className="text-sm text-gray-500 text-center py-4">Tidak ada transaksi pada periode ini.</p>
          )}
        </div>
        {/* Summary Footer */}
        {recentFinancials.length > 0 && (
          <div className="mt-6 pt-4 border-t bg-gray-50 rounded-b-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Pemasukan</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalPemasukan)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Pengeluaran</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(totalPengeluaran)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Selisih Bersih</p>
                <p className={`text-lg font-bold ${selisihBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(selisihBersih)}</p>
              </div>
            </div>
          </div>
        )}
      </NeumorphicCard>
    </div>
  );
}