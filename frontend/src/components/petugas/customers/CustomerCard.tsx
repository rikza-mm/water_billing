'use client';

import { useState } from 'react';
import { MapPin, Phone, User2, ChevronDown, ChevronUp, Droplets, History, Wallet, AlertCircle } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

interface CustomerCardProps {
  customer: {
    id: number;
    name: string;
    address: string;
    area: string;
    phoneNumber: string;
    status: string;
    saldo: string;
    hutang: string;
    meterNumber: number;
    category_name: string | null;
    lastReadingDate: string | null;
    lastPaymentDate: string | null;
    unpaidBills: number;
  };
}

// Helper untuk format angka meter tanpa trailing .00 dan aman null/undefined
const formatMeter = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  const num = Number(value);
  return Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
};

const formatDate = (date: string | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('id-ID');
};

export default function CustomerCard({ customer }: CustomerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`
      bg-[#e0e5ec] rounded-xl
      shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
      hover:shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]
      transition-all duration-300
      ${isExpanded ? 'p-6' : 'p-4'}
    `}>
      {/* Collapsed View */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {customer.name}
            </h3>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${getStatusColor(customer.status)}
            `}>
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User2 size={14} />
              <p className="text-xs">ID: {customer.id}</p>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={14} />
              <p className="text-xs">{formatMeter(customer.meterNumber)} m³</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 p-2 rounded-lg bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-blue-600 transition-all duration-300"
          title={isExpanded ? 'Sembunyikan detail' : 'Lihat detail'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Details */}
      <div className={`
        overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-screen opacity-100 mt-6' : 'max-h-0 opacity-0'}
      `}>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[140px] bg-[#e0e5ec] rounded-lg p-4 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
            <div className="flex items-center gap-2 mb-1">
              <History size={16} className="text-blue-600" />
              <span className="text-sm text-gray-600 font-medium">Tanggal Baca Terakhir</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {formatDate(customer.lastReadingDate)}
            </div>
          </div>
          <div className="flex-1 min-w-[140px] bg-[#e0e5ec] rounded-lg p-4 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-blue-600" />
              <span className="text-sm text-gray-600 font-medium">Tanggal Bayar Terakhir</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {formatDate(customer.lastPaymentDate)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <MapPin size={16} />
            </div>
            <span className="flex-1">{customer.address}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <Phone size={16} />
            </div>
            <span className="flex-1">{customer.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <Wallet size={16} className="text-green-600" />
            </div>
            <span className="flex-1">Saldo: {formatRupiah(Number(customer.saldo) || 0)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <span className="flex-1">Hutang: {formatRupiah(Number(customer.hutang) || 0)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <Droplets size={16} />
            </div>
            <span className="flex-1">Tagihan Belum Lunas: {customer.unpaidBills}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <User2 size={16} />
            </div>
            <span className="flex-1">Kategori: {customer.category_name || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
