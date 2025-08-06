'use client';

import React from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Printer,
  Share2,
  User,
  MapPin,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

interface CustomerFinancialSummary {
  customerName: string;
  address: string;
  phone: string;
  meterNumber: string;
  area: string;
  saldo: number;
  hutang: number;
  totalDebt: number;
  partialDebt: number;
  totalPaid: number;
  totalLateFees: number;
  calculatedDebt: number;
  unpaidBillsCount: number;
  paidBillsCount: number;
  partialBillsCount: number;
  averageBillAmount: number;
  lastPaymentDate?: string;
  earliestDueDate?: string;
}

interface CustomerInfoHeaderProps {
  customerFinancialSummary: CustomerFinancialSummary | null;
  isMobile: boolean;
  isSmallScreen: boolean;
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onPrint: () => void;
  onShare: () => void;
}

const CustomerInfoHeader: React.FC<CustomerInfoHeaderProps> = ({
  customerFinancialSummary,
  isMobile,
  isSmallScreen,
  loading,
  onBack,
  onRefresh,
  onExport,
  onPrint,
  onShare
}) => {
  return (
    <div className={`
      bg-[#e0e5ec] rounded-xl
      ${isMobile ? 'p-4' : 'p-6'}
      shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
      sm:shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`
              bg-[#e0e5ec] rounded-lg
              ${isMobile ? 'p-2' : 'p-3'}
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
              transition-all duration-200
            `}
          >
            <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-600`} />
          </button>
          <div>
            <h1 className={`
              ${isSmallScreen ? 'text-lg' : 'text-xl sm:text-2xl'}
              font-semibold text-gray-800
            `}>
              Customer History
            </h1>
            <p className="text-sm text-gray-600">Informasi detail riwayat pelanggan</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`
              bg-[#e0e5ec] rounded-lg
              ${isMobile ? 'p-2' : 'p-3'}
              shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
              hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
              transition-all duration-200
              disabled:opacity-50
            `}
          >
            <RefreshCw className={`
              ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}
              text-blue-600
              ${loading ? 'animate-spin' : ''}
            `} />
          </button>

          {!isMobile && (
            <>
              <button
                onClick={onExport}
                className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
              >
                <Download className="h-5 w-5 text-green-600" />
              </button>
              <button
                onClick={onPrint}
                className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
              >
                <Printer className="h-5 w-5 text-purple-600" />
              </button>
              <button
                onClick={onShare}
                className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
              >
                <Share2 className="h-5 w-5 text-orange-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Quick Info */}
      {customerFinancialSummary && (
        <div className={`
          grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}
          gap-3 sm:gap-4
        `}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 text-xs font-medium">Customer</span>
            </div>
            <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-blue-700 truncate`}>
              {customerFinancialSummary.customerName}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-green-600 text-xs font-medium">Saldo</span>
            </div>
            <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-green-700`}>
              {formatRupiah(customerFinancialSummary.saldo)}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 text-xs font-medium">Hutang</span>
            </div>
            <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-red-700`}>
              {formatRupiah(customerFinancialSummary.hutang)}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-purple-600" />
              <span className="text-purple-600 text-xs font-medium">Area</span>
            </div>
            <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-purple-700 truncate`}>
              {customerFinancialSummary.area}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInfoHeader;