import { useState } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { CustomerLedgerData } from '@/hooks/admin/analyst/useAnalystDashboard';
import { formatCurrency } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';

interface Props {
  fetchCustomerLedger: (customerId: number) => Promise<CustomerLedgerData>;
}

export const CustomerDetailTab = ({ fetchCustomerLedger }: Props) => {
  const [searchId, setSearchId] = useState('');
  const [customerData, setCustomerData] = useState<CustomerLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!searchId) return;
    setIsLoading(true);
    setError('');
    setCustomerData(null);
    fetchCustomerLedger(parseInt(searchId))
      .then(setCustomerData)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  return (
    <NeumorphicCard className="space-y-6 w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Analisis Detail Pelanggan (Ledger)</h3>
      <div className="flex gap-2 mb-6">
        <input 
          type="number" 
          placeholder="Masukkan ID Pelanggan..." 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="input-neumorphic flex-grow"
        />
        <button onClick={handleSearch} disabled={isLoading} className="button-neumorphic-primary flex items-center gap-2">
            <Search size={16}/> {isLoading ? 'Mencari...' : 'Cari'}
        </button>
      </div>

      {isLoading && <p className="text-center p-8">Mencari data pelanggan...</p>}
      {error && <p className="text-center p-8 text-red-500">{error}</p>}
      {!customerData && !isLoading && !error && <p className="text-center p-8 text-gray-500">Masukkan ID Pelanggan dan klik Cari untuk melihat detailnya.</p>}

      {customerData && !isLoading && (
        <div className="space-y-6">
          {/* Profil & Status Pelanggan */}
          <NeumorphicCard>
            <h4 className="text-xl font-bold text-gray-800 mb-2">{customerData.summary.full_name}</h4>
            <p className="text-gray-500 text-sm mb-4">{customerData.summary.address}, {customerData.summary.area_name}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
              <KpiCard title="Status" value={customerData.summary.status} color="gray" />
              <KpiCard title="Tunggakan" value={formatCurrency(parseFloat(customerData.summary.hutang))} color="red" />
              <KpiCard title="Saldo" value={formatCurrency(parseFloat(customerData.summary.saldo))} color="green" />
              <KpiCard title="No. Meter" value={customerData.summary.meter_number} color="gray" />
            </div>
          </NeumorphicCard>
          
          {/* Tabel Ledger */}
          <NeumorphicCard>
            <h4 className="font-semibold mb-4 flex items-center gap-2"><FileText/> Buku Besar Pelanggan (Ledger)</h4>
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm rounded-xl bg-[#e0e5ec] shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff]">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Tanggal</th>
                    <th className="p-2 text-left">Jenis</th>
                    <th className="p-2 text-left">Deskripsi</th>
                    <th className="p-2 text-right">Debit (Tagihan)</th>
                    <th className="p-2 text-right">Kredit (Pembayaran)</th>
                  </tr>
                </thead>
                <tbody>
                  {customerData.ledger.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-100 transition">
                      <td className="p-2">{new Date(item.event_date).toLocaleDateString('id-ID')}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 text-xs rounded-full ${item.event_type === 'TAGIHAN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.event_type}</span></td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right text-red-600">{formatCurrency(parseFloat(item.debit))}</td>
                      <td className="p-2 text-right text-green-600">{formatCurrency(parseFloat(item.credit))}</td>
                    </tr>
                  ))}
                  {customerData.ledger.length === 0 && (
                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">Tidak ada data ledger.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </NeumorphicCard>
        </div>
      )}
    </NeumorphicCard>
  );
};

// Helper KPI Card for summary grid
const KpiCard = ({ title, value, color }: { title: string; value: string; color?: string }) => (
  <div className="bg-[#e0e5ec] p-4 rounded-xl text-center shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] w-full">
    <p className="text-xs text-gray-500 mb-1">{title}</p>
    <p className={`text-xl font-bold ${color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-gray-800'}`}>{value}</p>
  </div>
);