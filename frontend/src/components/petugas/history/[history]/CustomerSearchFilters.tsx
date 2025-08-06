'use client';

import { useState, useMemo } from 'react';
import { Filter, ChevronDown, RefreshCw } from 'lucide-react';
import debounce from 'lodash/debounce';

// Tentukan tipe untuk filter, bisa diekspor dari hooks jika perlu
type FilterType = {
  customerId?: string;
  customerName?: string;
  paymentStatus?: 'all' | 'paid' | 'unpaid';
};

interface CustomerSearchFiltersProps {
  onSearch: (filters: Partial<FilterType>) => void;
  isLoading: boolean;
}

export default function CustomerSearchFilters({ onSearch, isLoading }: CustomerSearchFiltersProps) {
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [internalFilter, setInternalFilter] = useState<Partial<FilterType>>({});

  const debouncedSearch = useMemo(
    () => debounce((filters: Partial<FilterType>) => {
      onSearch(filters);
    }, 500),
    [onSearch]
  );

  const handleFilterChange = (field: keyof FilterType, value: string) => {
    const newFilters = { ...internalFilter, [field]: value };
    setInternalFilter(newFilters);
    debouncedSearch(newFilters);
  };

  const handleReset = () => {
    setInternalFilter({});
    onSearch({});
  };

  return (
    <div className="bg-[#e0e5ec] rounded-xl p-3 sm:p-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <button
        onClick={() => setShowFilterPanel(!showFilterPanel)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <span className="font-medium text-gray-800 text-sm sm:text-base">Filter & Pencarian</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-300 flex-shrink-0 ${showFilterPanel ? 'rotate-180' : ''}`} />
      </button>

      {showFilterPanel && (
        <div className="mt-3 sm:mt-4 space-y-3 pt-4 border-t border-gray-300/50">
          <input
            type="text"
            value={internalFilter.customerId || ''}
            onChange={(e) => handleFilterChange('customerId', e.target.value)}
            className="w-full p-2 sm:p-3 bg-[#e0e5ec] rounded-lg shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] border-none outline-none text-gray-800 placeholder-gray-500 text-sm"
            placeholder="Cari berdasarkan ID Pelanggan"
          />

          <input
            type="text"
            value={internalFilter.customerName || ''}
            onChange={(e) => handleFilterChange('customerName', e.target.value)}
            className="w-full p-2 sm:p-3 bg-[#e0e5ec] rounded-lg shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] border-none outline-none text-gray-800 placeholder-gray-500 text-sm"
            placeholder="Cari berdasarkan Nama Pelanggan"
          />

          <select
            value={internalFilter.paymentStatus || 'all'}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="w-full p-2 sm:p-3 bg-[#e0e5ec] rounded-lg shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] border-none outline-none text-gray-800 text-sm"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Sudah Bayar</option>
            <option value="unpaid">Belum Bayar</option>
          </select>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 bg-[#e0e5ec] py-2 px-3 sm:px-4 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] transition-all duration-300 flex items-center justify-center gap-2 text-red-600 font-medium text-sm"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}