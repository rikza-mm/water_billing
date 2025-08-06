import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  User,  
  Phone, 
  DollarSign, 
  Users,
  FileText,
  Receipt
} from 'lucide-react';
import { CustomerDetail } from '@/hooks/admin/customer/useAdminCustomers';

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customerDetail: CustomerDetail | null; 
  loading: boolean;
}

// Move these helpers outside the component
function generateUniqueKey<T>(item: T, index: number, prefix: string, idField: keyof T) {
  const id = item[idField];
  return `${prefix}_${id ?? index}_${Date.now()}`;
}

function removeDuplicates<T>(array: T[], keyField: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = item[keyField];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function CustomerDetailModal({ 
  open, 
  onClose, 
  customerDetail, 
  loading
}: CustomerDetailModalProps) {
const formatCurrency = (amount: string | number) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
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
      },
      paid: {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Lunas',
        icon: '✅'
      },
      unpaid: {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Belum Lunas',
        icon: '❌'
      },
      overdue: {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'Terlambat',
        icon: '⚠️'
      }
    };

    const badgeConfig = config[status as keyof typeof config] || config.inactive;

    return (
      <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full border ${badgeConfig.color}`}>
        <span>{badgeConfig.icon}</span>
        {badgeConfig.text}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-[#d1d5dc] px-6 py-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-800">
                  Detail Pelanggan
                </DialogTitle>
                <p className="text-sm text-gray-600">Informasi lengkap pelanggan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat detail pelanggan...</p>
              </div>
            </div>
          ) : !customerDetail || !customerDetail.profile ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Data Tidak Ditemukan</h3>
              <p className="text-gray-500">Detail pelanggan tidak dapat dimuat</p>
              <div className="mt-4 text-xs text-gray-400">
                Debug: customerDetail = {JSON.stringify(customerDetail)}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informasi Dasar */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Informasi Dasar</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nama Pelanggan</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {customerDetail.profile.name || 'Tidak ada data'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">ID Pelanggan</p>
                    <p className="text-sm font-semibold text-gray-800">{customerDetail.profile.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(customerDetail.profile.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Wilayah</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {customerDetail.profile.area || 'Tidak ada data'}
                    </p>
                  </div>
                    {/* ✅ TAMBAHKAN BAGIAN INI */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Kategori</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {customerDetail.profile.category_name || 'Tidak ada kategori'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kontak & Alamat */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Kontak & Alamat</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nomor Telepon</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {customerDetail.profile.phoneNumber || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Alamat</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {customerDetail.profile.address || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keuangan */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Status Keuangan</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Saldo</p>
                    <p className="text-sm font-semibold text-green-700">
                      {formatCurrency(customerDetail.profile.saldo || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Hutang</p>
                    <p className="text-sm font-semibold text-red-700">
                      {formatCurrency(customerDetail.profile.hutang || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ BAGIAN BARU: RIWAYAT TAGIHAN - DIPERBAIKI */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Ringkasan 7 Tagihan Terakhir</h3>
                </div>
                <div className="space-y-2">
                  {customerDetail.billingHistory && customerDetail.billingHistory.length > 0 ? (
                    removeDuplicates(customerDetail.billingHistory, 'bill_id')
                      .slice(0, 7)
                      .map((bill, index) => (
                        <div
                          key={generateUniqueKey(bill, index, 'bill', 'bill_id')}
                          className="grid grid-cols-3 gap-2 text-sm p-2 rounded-lg hover:bg-white/50"
                        >
                          <div className="text-gray-600">
                            {new Date(bill.period_start as string).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="font-semibold text-gray-800 text-right">{formatCurrency(bill.amount)}</div>
                          <div className="text-right">{getStatusBadge(bill.bill_status)}</div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center p-4">Tidak ada riwayat tagihan.</p>
                  )}
                </div>
              </div>

              {/* ✅ BAGIAN BARU: RIWAYAT PEMBAYARAN - DIPERBAIKI */}
              <div className="bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">5 Pembayaran Terakhir</h3>
                </div>
                <div className="space-y-2">
                  {customerDetail.paymentHistory && customerDetail.paymentHistory.length > 0 ? (
                    removeDuplicates(customerDetail.paymentHistory, 'payment_id')
                      .slice(0, 5)
                      .map((payment, index) => (
                        <div
                          key={generateUniqueKey(payment, index, 'payment', 'payment_id')}
                          className="grid grid-cols-3 gap-2 text-sm p-2 rounded-lg hover:bg-white/50"
                        >
                          <div className="text-gray-600">
                            {new Date(payment.transaction_date as string).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="font-semibold text-gray-800 text-right">{formatCurrency(payment.amount)}</div>
                          <div className="text-right capitalize">{payment.method}</div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center p-4">Tidak ada riwayat pembayaran.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 