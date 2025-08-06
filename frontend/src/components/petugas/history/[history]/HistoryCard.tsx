'use client';

import { useState } from 'react';
import {
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  DollarSign,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  name: string;
  area: string;
  phoneNumber: string;
  lastReading: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  totalBills?: number;
  totalAmount?: number;
  lastPaymentDate?: string;
  // Informasi finansial
  saldo?: number;
  hutang?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  // Informasi tambahan
  meterNumber?: string;
  customerType?: string;
  status?: 'active' | 'inactive' | 'suspended';
  lastBillAmount?: number;
  overdueMonths?: number;
  averageMonthlyBill?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
}

interface HistoryCardProps {
  history: HistoryItem;
  onViewDetails: (customerId: string) => void;
}

export default function HistoryCard({ history, onViewDetails }: HistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Lunas';
      case 'unpaid':
        return 'Belum Bayar';
      case 'partial':
        return 'Sebagian';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`
      bg-[#e0e5ec] rounded-xl
      shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
      hover:shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]
      transition-all duration-300
      ${isExpanded ? 'p-6' : 'p-4'}
    `}>
      {/* Collapsed View - Minimal Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {history.name}
            </h3>
            <div className="flex gap-1">
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${getStatusColor(history.paymentStatus)}
              `}>
                {getStatusText(history.paymentStatus)}
              </span>
            </div>
          </div>

          {/* Always visible minimal info */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span className="text-xs">ID: {history.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onViewDetails(history.id)}
            className={`
              p-2 rounded-lg
              bg-[#e0e5ec]
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
              text-blue-600
              transition-all duration-300
            `}
            title="Lihat detail riwayat"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              p-2 rounded-lg
              bg-[#e0e5ec]
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
              text-blue-600
              transition-all duration-300
            `}
            title={isExpanded ? 'Sembunyikan detail' : 'Lihat detail'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details - Overview Only */}
      <div className={`
        overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-screen opacity-100 mt-6' : 'max-h-0 opacity-0'}
      `}>
        {/* Quick Overview - 2x2 Grid (Sederhana: hanya 2 kolom) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">Pembacaan</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {history.lastReading} m³
            </div>
          </div>

          <div className="bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-green-600" />
              <span className="text-xs text-gray-600 font-medium">Tagihan</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {history.totalBills || 0} bulan
            </div>
          </div>
        </div>

        {/* Contact Information - Simplified */}
        <div className="grid grid-cols-1 gap-2 text-sm">
          {history.totalAmount && (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
                <DollarSign size={14} className="text-green-600" />
              </div>
              <span className="flex-1">Total: {formatCurrency(history.totalAmount)}</span>
            </div>
          )}
        </div>

        {/* Quick Alert - Only Critical Info */}
        {((history.hutang && history.hutang > 0) || (history.overdueMonths && history.overdueMonths > 0)) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={14} />
              <span className="font-medium text-xs">
                {(history.hutang && history.hutang > 0) && `Hutang: ${formatCurrency(history.hutang)}`}
                {(history.hutang && history.hutang > 0) && (history.overdueMonths && history.overdueMonths > 0) && ' • '}
                {(history.overdueMonths && history.overdueMonths > 0) && `${history.overdueMonths} bulan tunggakan`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
