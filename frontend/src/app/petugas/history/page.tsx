'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useHistoryDashboard, HistoryFilter as FilterType } from '@/hooks/petugas/history/useHistoryDashboard';
import HistoryStatistics from '@/components/petugas/history/[history]/HistoryStatistics';
import CustomerSearchFilters from '@/components/petugas/history/[history]/CustomerSearchFilters';
import HistoryCard from '@/components/petugas/history/[history]/HistoryCard';
import HistoryCardSkeleton from '@/components/petugas/history/[history]/HistoryCardSkeleton';

export default function HistoryPage() {
  const router = useRouter();

  const {
    loading,
    error,
    histories,
    summary,
    pagination,
    fetchHistories,
  } = useHistoryDashboard();

  const [filter, setFilter] = useState<Partial<FilterType>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const memoizedFetchHistories = useMemo(() => {
    return () => fetchHistories(filter, currentPage);
  }, [fetchHistories, filter, currentPage]);

  useEffect(() => {
    memoizedFetchHistories();
  }, [memoizedFetchHistories]);
  
  const handleSearch = useCallback((newFilter: Partial<FilterType>) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset ke halaman pertama setiap ada filter baru
  }, []);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <HistoryStatistics summary={summary} />
      <CustomerSearchFilters onSearch={handleSearch} isLoading={loading} />

      {loading && histories.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <HistoryCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-8 bg-[#e0e5ec] rounded-xl shadow-neumorph-inset">
          <p>Gagal memuat data.</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : histories.length === 0 ? (
        <div className="text-center p-8 bg-[#e0e5ec] rounded-xl shadow-neumorph-inset">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Tidak Ada Riwayat Ditemukan</h3>
          <p className="text-sm text-gray-500">Coba ubah filter pencarian Anda.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {histories.map((historyItem) => (
              <HistoryCard 
                key={historyItem.id} 
                history={historyItem} 
                onViewDetails={(customerId) => router.push(`/petugas/history/${customerId}`)}
              />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="bg-[#e0e5ec] rounded-xl p-3 sm:p-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Halaman {pagination.currentPage} dari {pagination.totalPages}
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className="p-2 bg-[#e0e5ec] rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    className="p-2 bg-[#e0e5ec] rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
