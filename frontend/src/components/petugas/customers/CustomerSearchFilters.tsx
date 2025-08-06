'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

interface CustomerSearchFiltersProps {
  onSearch: (search: string, status: string, usage: string) => void;
}

export default function CustomerSearchFilters({ onSearch }: CustomerSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');

  // Buat fungsi search yang akan di-debounce
  const handleSearch = useCallback(
    (search: string, status: string, usage: string) => {
      onSearch(search, status, usage);
    },
    [onSearch]
  );

  // Buat fungsi debounced menggunakan useMemo
  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch]
  );

  // Cleanup debounce pada unmount
  useCallback(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value, statusFilter, usageFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    handleSearch(searchQuery, value, usageFilter);
  };

  const handleUsageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setUsageFilter(value);
    handleSearch(searchQuery, statusFilter, value);
  };

  return (
    <div className="bg-[#e0e5ec] rounded-xl p-6
      shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari customer..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-3 rounded-lg
              bg-[#e0e5ec]
              shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
              text-gray-700 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-3 top-3 text-gray-500" size={20} />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="p-3 rounded-lg
            bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            text-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={usageFilter}
          onChange={handleUsageChange}
          className="p-3 rounded-lg
            bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            text-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Penggunaan</option>
          <option value="high">Tinggi ({'>'}20m³)</option>
          <option value="medium">Sedang (10-20m³)</option>
          <option value="low">Rendah ({'<'}10m³)</option>
        </select>
      </div>
    </div>
  );
}
