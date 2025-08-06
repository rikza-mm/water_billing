"use client";

import { useState, useCallback } from "react";
import { useAreaDashboard } from "@/hooks/admin/area/useAreaDashboard";
import { AreaSearch } from "@/components/admin/area/AreaSearch";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { AddAreaModal } from "@/components/admin/area/AddAreaModal";

export default function AreaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    areas,
    metadata,
    loading,
    error,
    selectedArea,
    setSelectedArea,
    createArea,
    updateArea,
    deleteArea,
    fetchDashboardData,
    clearError
  } = useAreaDashboard();

  // Handler untuk pencarian
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    fetchDashboardData({ search: value });
  }, [fetchDashboardData]);

  // Handler untuk create area
  const handleCreateArea = async (data: { area_name: string; postal_code?: string }) => {
    try {
      await createArea(data);
      toast.success("Area berhasil dibuat");
      setShowAddForm(false);
      return true;
    } catch {
      toast.error("Gagal membuat area");
      return false;
    }
  };

  // Handler untuk update area
  const handleUpdateArea = async (id: number, data: { area_name?: string; postal_code?: string }) => {
    try {
      await updateArea(id, data);
      toast.success("Area berhasil diperbarui");
      setSelectedArea(null);
      return true;
    } catch {
      toast.error("Gagal memperbarui area");
      return false;
    }
  };

  // Handler untuk delete area
  const handleDeleteArea = async (id: number) => {
    try {
      await deleteArea(id);
      toast.success("Area berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus area");
    }
  };

  // Loading state
  if (loading && !metadata) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e0e5ec]">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              fetchDashboardData();
            }}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white flex items-center gap-2 hover:bg-blue-600 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Filter areas based on search
  const filteredAreas = areas.filter(area =>
    area.area_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (area.postal_code && area.postal_code.includes(searchQuery))
  );

  return (
    <main className="p-6 space-y-6 overflow-y-auto bg-[#e0e5ec]">
      {/* Statistics */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Area</h3>
            <p className="text-3xl font-bold text-blue-600">{metadata?.total_areas || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Area dengan Petugas</h3>
            <p className="text-3xl font-bold text-green-600">{metadata?.areas_with_officers || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Pelanggan</h3>
            <p className="text-3xl font-bold text-purple-600">{metadata?.total_customers || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Petugas</h3>
            <p className="text-3xl font-bold text-orange-600">{metadata?.total_officers || 0}</p>
          </div>
        </div>
      </div>

      {/* Header and Search */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Manajemen Area</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white flex items-center gap-2 hover:bg-blue-600 transition"
          >
            Tambah Area
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <AreaSearch
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
          />
        </div>
      </div>

      {/* Area Table */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Daftar Area</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Area</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Kode Pos</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Pelanggan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Petugas</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area) => (
                  <tr key={area.area_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{area.area_name}</td>
                    <td className="py-3 px-4 text-gray-600">{area.postal_code || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{area.total_customers}</td>
                    <td className="py-3 px-4 text-gray-600">{area.total_officers}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedArea(area)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area.area_id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAreas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data area
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms */}
      <AddAreaModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleCreateArea}
      />
      <AddAreaModal
        isOpen={!!selectedArea}
        onClose={() => setSelectedArea(null)}
        onSubmit={async (data) => {
          if (!selectedArea) throw new Error('No area selected');
          return handleUpdateArea(selectedArea.area_id, data);
        }}
        initialData={selectedArea ?? undefined}
        isEdit
      />
    </main>
  );
}
