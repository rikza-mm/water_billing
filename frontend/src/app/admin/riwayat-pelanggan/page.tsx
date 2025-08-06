'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Eye,
  DollarSign,
  MapPin,
  User,
  RefreshCw
} from 'lucide-react';
import { useAdminCustomerHistory } from '@/hooks/admin/history/useAdminCustomerHistory';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'blocked': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-50 text-gray-400';
  }
}
function getStatusText(status?: string) {
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Tidak Aktif';
    case 'blocked': return 'Blokir';
    default: return 'Tidak Diketahui';
  }
}

export default function CustomerHistoryPage() {
  const router = useRouter();
  const { customerList, isListLoading, fetchCustomerList } = useAdminCustomerHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      fetchCustomerList(debouncedQuery);
    } else {
      fetchCustomerList(); // Ambil semua pelanggan jika query kosong
    }
  }, [debouncedQuery, fetchCustomerList]);

  return (
    <div className="min-h-screen bg-[#e0e5ec] p-4">
      {/* Header */}
      <div className="bg-[#e0e5ec] p-6 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              Riwayat Pelanggan
            </h1>
            <p className="text-gray-600 mt-1">Cari dan lihat riwayat tagihan pelanggan</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan ID, nama, nomor meter, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#d1d5dc] rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
          />
          {isListLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {searchQuery.trim().length >= 2 && (
        <div className="bg-[#e0e5ec] p-6 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Hasil Pencarian ({customerList.length})
          </h2>

          {customerList.length === 0 && !isListLoading ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada pelanggan yang ditemukan</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customerList.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="bg-[#d1d5dc] p-4 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] hover:shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{customer.full_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(customer.status)}`}>
                          {getStatusText(customer.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>ID: {customer.customer_id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{customer.area_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Saldo: {customer.saldo}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <span>{customer.address}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {customer.hutang > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Hutang: {customer.hutang}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => router.push(`/admin/riwayat-pelanggan/${customer.customer_id}`)}
                        className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200 text-blue-600"
                        title="Lihat Riwayat"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {searchQuery.trim().length < 2 && (
        <div className="bg-[#e0e5ec] p-6 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Cari Pelanggan
          </h3>
          <p className="text-gray-500">
            Masukkan minimal 2 karakter untuk mencari pelanggan berdasarkan ID, nama, nomor meter, atau nomor telepon.
          </p>
        </div>
      )}
    </div>
  );
}
