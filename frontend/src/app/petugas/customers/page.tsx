'use client';

import CustomerSearchFilters from '@/components/petugas/customers/CustomerSearchFilters';
import CustomerCard from '@/components/petugas/customers/CustomerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAllCustomersInMyArea } from '@/hooks/petugas/customer/useAllCustomersInMyArea';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const { customers, loading, error } = useAllCustomersInMyArea();
  const [filters, setFilters] = useState({ search: '', status: 'all', usage: 'all' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Atur sesuai kebutuhan

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        !filters.search ||
        c.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        String(c.id).includes(filters.search);

      const matchStatus =
        filters.status === 'all' || c.status === filters.status;

      // Usage filter is not available in the new Customer type, so always true
      const matchUsage = true;
      // If you want to keep the UI, you can add a fallback or remove the filter
      // Example fallback (always true):
      // matchUsage = true;

      return matchSearch && matchStatus && matchUsage;
    });
  }, [customers, filters]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset ke halaman 1 jika filter berubah
  // (opsional, bisa tambahkan useEffect jika ingin otomatis reset halaman saat filter berubah)

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <CustomerSearchFilters
        onSearch={(search, status, usage) => {
          setFilters({ search, status, usage });
          setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
        }}
      />

      {paginatedCustomers.length > 0 ? (
        <div className="space-y-4">
          {paginatedCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={{
              ...customer,
              // Provide fallback for missing fields if needed (shouldn't be needed if API matches type)
              // All fields should be present as per the new Customer type
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-[#e0e5ec] rounded-xl shadow-neumorph-inset">
          <h3 className="text-lg font-medium text-gray-600">Tidak Ada Pelanggan Ditemukan</h3>
          <p className="text-sm text-gray-500">Coba ubah filter pencarian Anda atau periksa kembali penugasan area.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-[#e0e5ec] rounded-xl p-3 sm:p-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-[#e0e5ec] rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-[#e0e5ec] rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
