"use client";

import { useState } from 'react';
import { useOfficerDashboard } from "@/hooks/admin/officer/useOfficerDashboard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { UserPlus, Search, RefreshCw } from "lucide-react";
import { AddOfficerModal } from "@/components/admin/officer/AddOfficerModal";

export default function ManagePetugasPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const {
    officers,
    metadata,
    loading,
    error,
    selectedOfficer,
    setSelectedOfficer,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    fetchDashboardData,
    clearError
  } = useOfficerDashboard();



  // Handler untuk create officer
  const handleCreateOfficer = async (data: {
    username: string;
    password: string;
    full_name: string;
    phone_number: string;
    whatsapp_number?: string;
    salary?: number;
  }) => {
    try {
      await createOfficer(data);
      toast.success("Petugas berhasil dibuat");
      setShowAddForm(false);
      return true;
    } catch {
      toast.error("Gagal membuat petugas");
      return false;
    }
  };

  // Handler untuk update officer
  const handleUpdateOfficer = async (id: number, data: {
    username?: string;
    full_name?: string;
    phone_number?: string;
    whatsapp_number?: string;
    salary?: number;
    is_active?: boolean;
  }) => {
    try {
      await updateOfficer(id, data);
      toast.success("Petugas berhasil diperbarui");
      setSelectedOfficer(null);
      return true;
    } catch {
      toast.error("Gagal memperbarui petugas");
      return false;
    }
  };

  // Handler untuk delete officer
  const handleDeleteOfficer = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus petugas ini?')) {
      try {
        await deleteOfficer(id);
        toast.success("Petugas berhasil dihapus");
      } catch {
        toast.error("Gagal menghapus petugas");
      }
    }
  };



  // Filter officers based on search and status
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.phone_number.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || officer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <main className="p-6 space-y-6 overflow-y-auto bg-[#e0e5ec]">
      {/* Statistics */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Petugas</h3>
            <p className="text-3xl font-bold text-blue-600">{metadata?.total_officers || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Petugas Aktif</h3>
            <p className="text-3xl font-bold text-green-600">{metadata?.active_officers || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Pelanggan</h3>
            <p className="text-3xl font-bold text-purple-600">{metadata?.total_customers || 0}</p>
          </div>
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Area Tercakup</h3>
            <p className="text-3xl font-bold text-orange-600">{metadata?.total_areas_covered || 0}</p>
          </div>
        </div>
      </div>

      {/* Header and Search */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Manajemen Petugas</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white flex items-center gap-2 hover:bg-blue-600 transition shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]"
            >
              <UserPlus className="h-5 w-5" />
              Tambah Petugas
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari petugas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none"
                />
                <Search className="absolute right-3 top-3 text-gray-600 h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Table */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Daftar Petugas</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Telepon</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Area</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((officer) => (
                  <tr key={officer.officer_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{officer.full_name}</td>
                    <td className="py-3 px-4 text-gray-600">{officer.username}</td>
                    <td className="py-3 px-4 text-gray-600">{officer.phone_number}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {officer.areas.length > 0 ? officer.areas.map(area => area.name).join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        officer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {officer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOfficer(officer)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOfficer(officer.officer_id)}
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
            {filteredOfficers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data petugas
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms */}
      <AddOfficerModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={async (data) => {
          // Ensure password is always a string
          return handleCreateOfficer({ ...data, password: data.password ?? '' });
        }}
      />
      <AddOfficerModal
        isOpen={!!selectedOfficer}
        onClose={() => setSelectedOfficer(null)}
        onSubmit={async (data) => {
          if (!selectedOfficer) throw new Error('No officer selected');
          return handleUpdateOfficer(selectedOfficer.officer_id, data);
        }}
        initialData={selectedOfficer ?? undefined}
        isEdit
      />


    </main>
  );
}
