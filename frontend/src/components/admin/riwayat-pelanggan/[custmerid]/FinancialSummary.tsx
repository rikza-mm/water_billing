'use client';

import React from 'react';
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

interface FinancialSummaryProps {
  customerFinancialSummary: CustomerFinancialSummary;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  customerFinancialSummary
}) => {
  return (
    <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">Ringkasan Keuangan</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#d1d5dc] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
          <div className="text-sm text-gray-600">Total Tagihan</div>
          <div className="font-semibold text-gray-800">
            {customerFinancialSummary.paidBillsCount + customerFinancialSummary.unpaidBillsCount}
          </div>
        </div>
        <div className="bg-[#d1d5dc] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
          <div className="text-sm text-gray-600">Total Dibayar</div>
          <div className="font-semibold text-green-600">
            {formatRupiah(customerFinancialSummary.totalPaid)}
          </div>
        </div>
        <div className="bg-[#d1d5dc] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
          <div className="text-sm text-gray-600">Total Hutang</div>
          <div className="font-semibold text-red-600">
            {formatRupiah(customerFinancialSummary.totalDebt)}
          </div>
        </div>
        <div className="bg-[#d1d5dc] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
          <div className="text-sm text-gray-600">Rata-rata Tagihan</div>
          <div className="font-semibold text-blue-600">
            {formatRupiah(customerFinancialSummary.averageBillAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;