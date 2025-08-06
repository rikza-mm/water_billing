import { Customer } from '@/hooks/admin/customer/useAdminCustomers';
import { Eye, Users, MapPin, DollarSign, AlertTriangle, Pencil, Power } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onDetail: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onStatusChange: (customer: Customer) => void;
  currentPage: number;
  perPage: number;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: {
      color: 'bg-green-100 text-green-800 border-green-200',
      text: 'Aktif',
      icon: '🟢'
    },
    suspended: {
      color: 'bg-red-100 text-red-800 border-red-200',
      text: 'Ditangguhkan',
      icon: '🔴'
    },
    inactive: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      text: 'Tidak Aktif',
      icon: '⚪'
    }
  };

  const badgeConfig = config[status as keyof typeof config] || config.inactive;

  return (
    <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full border ${badgeConfig.color}`}>
      <span>{badgeConfig.icon}</span>
      {badgeConfig.text}
    </span>
  );
}

function DebtBadge({ hutang }: { hutang: string }) {
  const value = Number(hutang);
  const hasDebt = value > 0;
  
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${hasDebt ? 'bg-red-500' : 'bg-green-500'}`}></span>
      <span className={`text-sm font-medium ${hasDebt ? 'text-red-700' : 'text-green-700'}`}>
        {new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)}
      </span>
    </div>
  );
}

function BalanceDisplay({ saldo }: { saldo: string }) {
  const value = Number(saldo);
  const isPositive = value >= 0;
  
  return (
    <span className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
      {new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)}
    </span>
  );
}

interface CustomerStatusButtonProps {
  customer: Customer;
  onStatusChange: (customer: Customer) => void;
}

export function CustomerStatusButton({ customer, onStatusChange }: CustomerStatusButtonProps) {
  // Determine button style and label
  let label: string;
  let colorClass: string;
  let iconColor: string;

  switch (customer.status) {
    case 'active':
      label = 'Nonaktifkan';
      colorClass = 'bg-red-500 hover:bg-red-600 text-white';
      iconColor = 'text-white';
      break;
    case 'inactive':
      label = 'Aktifkan';
      colorClass = 'bg-green-500 hover:bg-green-600 text-white';
      iconColor = 'text-white';
      break;
    case 'suspended':
      label = 'Aktifkan';
      colorClass = 'bg-green-500 hover:bg-green-600 text-white';
      iconColor = 'text-white';
      break;
    default:
      label = 'Nonaktifkan';
      colorClass = 'bg-gray-400 text-white';
      iconColor = 'text-white';
      break;
  }

  return (
    <button
      className={`p-2.5 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] transition-all duration-200 group-hover:scale-105 ${colorClass}`}
      title={label}
      onClick={() => onStatusChange(customer)}
      type="button"
    >
      <Power className={`w-5 h-5 ${iconColor}`} />
    </button>
  );
}

export default function CustomerTable({ 
  customers, 
  loading, 
  onDetail, 
  onEdit, 
  onStatusChange, 
  currentPage = 1, 
  perPage = 10 
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data pelanggan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Tidak Ada Data Pelanggan</h3>
          <p className="text-gray-500">Belum ada data pelanggan yang ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl overflow-hidden">
      {/* Header Tabel */}
      <div className="bg-[#d1d5dc] px-6 py-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Daftar Pelanggan</h3>
              <p className="text-sm text-gray-600">
                {customers.length} pelanggan ditemukan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#e0e5ec] border-b border-gray-200/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                No.
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  Nama Pelanggan
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  Alamat & Wilayah
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} />
                  Saldo
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Hutang
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#e0e5ec] divide-y divide-gray-200/50">
            {customers.map((customer, index) => {
              const rowNumber = (currentPage - 1) * perPage + index + 1;
              
              return (
                <tr 
                  key={customer.id} 
                  className="hover:bg-[#d1d5dc]/50 transition-all duration-200 group"
                >
                  {/* Nomor Urut */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#e0e5ec] rounded-full shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] text-sm font-semibold text-gray-700">
                      {rowNumber}
                    </div>
                  </td>

                  {/* Nama Pelanggan */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {customer.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {customer.id} • {customer.category_name || 'Kategori Default'}
                      </div>
                    </div>
                  </td>

                  {/* Alamat & Wilayah */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-800 max-w-xs truncate">
                        {customer.address}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {customer.area}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={customer.status} />
                  </td>

                  {/* Saldo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BalanceDisplay saldo={customer.saldo} />
                  </td>

                  {/* Hutang */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DebtBadge hutang={customer.hutang} />
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] text-blue-600 transition-all duration-200 group-hover:scale-105"
                        title="Lihat Detail Pelanggan"
                        onClick={() => onDetail(customer)}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] text-yellow-600 transition-all duration-200 group-hover:scale-105"
                        title="Edit Pelanggan"
                        onClick={() => onEdit(customer)}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <CustomerStatusButton customer={customer} onStatusChange={onStatusChange} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Tabel */}
      <div className="bg-[#d1d5dc] px-6 py-3 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Menampilkan {customers.length} dari total data pelanggan
          </span>
          <span className="text-xs text-gray-500">
            Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}