"use client";

import { useState, useEffect } from 'react';
import { useAreaDashboard } from '@/hooks/admin/area/useAreaDashboard';
import { useOfficerDashboard } from '@/hooks/admin/officer/useOfficerDashboard';
import AssignmentStatusCard from '@/components/admin/officerArea/AssignmentStatusCard';
import AssignmentManagement from '@/components/admin/officerArea/AssignmentManagement';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  Users,
  MapPin,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle,
  UserCheck,
  ExternalLink,
  BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PenempatanAreaPage() {
  const router = useRouter();
  const [selectedOfficer, setSelectedOfficer] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'bulk'>('single');
  const [bulkAssignments, setBulkAssignments] = useState<Array<{officer_id: number, area_id: number}>>([]);

  const {
    areas,
    loading: areaLoading,
    assignOfficerToArea,
    unassignOfficerFromArea,
    transferOfficer,
    fetchDashboardData: refreshAreas
  } = useAreaDashboard();

  const {
    officers,
    loading: officerLoading,
    bulkAssignOfficers,
    fetchDashboardData: refreshOfficers
  } = useOfficerDashboard();

  useEffect(() => {
    refreshAreas();
    refreshOfficers();
  }, [refreshAreas, refreshOfficers]);

  const handleSingleAssignment = async () => {
    if (!selectedOfficer || !selectedArea) {
      toast.error('Pilih petugas dan area terlebih dahulu');
      return;
    }

    try {
      await assignOfficerToArea(selectedArea, selectedOfficer);
      toast.success('Petugas berhasil ditugaskan ke area');
      setSelectedOfficer(null);
      setSelectedArea(null);
      refreshAreas();
      refreshOfficers();
    } catch {
      toast.error('Gagal menugaskan petugas');
    }
  };

  const handleUnassignment = async (areaId: number, officerId: number) => {
    try {
      await unassignOfficerFromArea(areaId, officerId);
      toast.success('Penugasan petugas berhasil dibatalkan');
      refreshAreas();
      refreshOfficers();
    } catch {
      toast.error('Gagal membatalkan penugasan');
    }
  };

  const addToBulkAssignment = () => {
    if (!selectedOfficer || !selectedArea) {
      toast.error('Pilih petugas dan area terlebih dahulu');
      return;
    }

    const exists = bulkAssignments.some(
      assignment => assignment.officer_id === selectedOfficer && assignment.area_id === selectedArea
    );

    if (exists) {
      toast.error('Penugasan sudah ada dalam daftar');
      return;
    }

    setBulkAssignments([...bulkAssignments, { officer_id: selectedOfficer, area_id: selectedArea }]);
    setSelectedOfficer(null);
    setSelectedArea(null);
    toast.success('Ditambahkan ke daftar penugasan');
  };

  const removeFromBulkAssignment = (index: number) => {
    setBulkAssignments(bulkAssignments.filter((_, i) => i !== index));
  };

  const handleBulkAssignment = async () => {
    if (bulkAssignments.length === 0) {
      toast.error('Tidak ada penugasan dalam daftar');
      return;
    }

    try {
      const assignments = bulkAssignments.map(assignment => ({
        user_id: assignment.officer_id,
        area_id: assignment.area_id
      }));

      await bulkAssignOfficers(assignments);
      toast.success(`${bulkAssignments.length} penugasan berhasil diproses`);
      setBulkAssignments([]);
      refreshAreas();
      refreshOfficers();
    } catch {
      toast.error('Gagal memproses penugasan massal');
    }
  };

  const getOfficerName = (officerId: number) => {
    const officer = officers.find(o => o.officer_id === officerId);
    return officer?.full_name || 'Unknown';
  };

  const getAreaName = (areaId: number) => {
    const area = areas.find(a => a.area_id === areaId);
    return area?.area_name || 'Unknown';
  };

  // Ubah: tampilkan semua petugas aktif
  const activeOfficers = officers.filter(officer => officer.status === 'active');

  const unassignedOfficers = officers.filter(officer =>
    officer.areas && officer.areas.length === 0 && officer.status === 'active'
  );

  const areasWithoutOfficers = areas.filter(area =>
    area.assigned_officers && area.assigned_officers.length === 0
  );

  // Ubah: pada panel area, disable area yang sudah dimiliki petugas terpilih
  const selectedOfficerObj = activeOfficers.find(o => o.officer_id === selectedOfficer);
  const officerAreaNames = selectedOfficerObj?.areas?.map(a => a.name) || [];

  // Handler toggle seleksi officer
  const handleSelectOfficer = (officerId: number) => {
    setSelectedOfficer(prev => (prev === officerId ? null : officerId));
    // Jika membatalkan seleksi officer, area juga ikut dibatalkan
    if (selectedOfficer === officerId) setSelectedArea(null);
  };

  // Handler toggle seleksi area
  const handleSelectArea = (areaId: number, alreadyAssigned: boolean) => {
    if (alreadyAssigned) return;
    setSelectedArea(prev => (prev === areaId ? null : areaId));
  };

  if (areaLoading || officerLoading) {
    return (
      <main className="p-6 space-y-6 overflow-y-auto bg-[#e0e5ec]">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
          <span className="ml-3 text-black font-medium">Memuat data penempatan area...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 overflow-y-auto bg-[#e0e5ec]">
      {/* Header */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">Penempatan Area Petugas</h1>
            <p className="text-gray-700 mt-1">Kelola penugasan petugas ke area layanan</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/manage-petugas')}
              className="px-4 py-2 rounded-xl bg-green-500 text-white flex items-center gap-2 hover:bg-green-600 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]"
            >
              <ExternalLink className="h-5 w-5" />
              Kelola Petugas
            </button>
            <button
              onClick={() => router.push('/admin/area')}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white flex items-center gap-2 hover:bg-purple-600 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]"
            >
              <MapPin className="h-5 w-5" />
              Kelola Area
            </button>
            <button
              onClick={() => {
                refreshAreas();
                refreshOfficers();
              }}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white flex items-center gap-2 hover:bg-blue-600 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Status */}
      <AssignmentStatusCard
        totalOfficers={officers.length}
        assignedOfficers={officers.filter(o => o.areas && o.areas.length > 0).length}
        totalAreas={areas.length}
        areasWithOfficers={areas.filter(a => a.assigned_officers && a.assigned_officers.length > 0).length}
        unassignedOfficers={officers.filter(o => o.areas && o.areas.length === 0 && o.status === 'active').length}
        areasWithoutOfficers={areas.filter(a => a.assigned_officers && a.assigned_officers.length === 0).length}
      />

      {/* Mode Toggle */}
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-black mb-4">Mode Penugasan</h2>
        <div className="flex bg-[#e0e5ec] rounded-xl p-1 shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
          <button
            onClick={() => setAssignmentMode('single')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
              assignmentMode === 'single'
                ? 'bg-[#e0e5ec] text-black shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            <UserCheck className="h-5 w-5" />
            Penugasan Tunggal
          </button>
          <button
            onClick={() => setAssignmentMode('bulk')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
              assignmentMode === 'bulk'
                ? 'bg-[#e0e5ec] text-black shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            <Users className="h-5 w-5" />
            Penugasan Massal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Officer Selection */}
        <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
            <Users className="h-5 w-5 mr-2 text-black" />
            Pilih Petugas
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeOfficers.map((officer) => (
              <div
                key={officer.officer_id}
                onClick={() => handleSelectOfficer(officer.officer_id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedOfficer === officer.officer_id
                    ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] border-2 border-blue-500'
                    : 'bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]'
                }`}
              >
                <div className="font-medium text-black flex items-center gap-2">
                  {officer.full_name}
                  {officer.areas && officer.areas.length > 0 && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck size={12} />
                      {officer.areas.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700">{officer.username}</div>
                <div className="text-xs text-gray-600">{officer.phone_number}</div>
              </div>
            ))}
            {activeOfficers.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Tidak ada petugas aktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Area Selection */}
        <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
            <MapPin className="h-5 w-5 mr-2 text-black" />
            Pilih Area
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {areas.map((area) => {
              const alreadyAssigned = officerAreaNames.includes(area.area_name);
              return (
                <div
                  key={area.area_id}
                  onClick={() => handleSelectArea(area.area_id, alreadyAssigned)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedArea === area.area_id
                      ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] border-2 border-green-500'
                      : alreadyAssigned
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#e0e5ec] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]'
                  }`}
                  style={alreadyAssigned ? { pointerEvents: 'none' } : {}}
                >
                  <div className="font-medium text-black flex items-center gap-2">
                    {area.area_name}
                    {alreadyAssigned && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sudah ditugaskan</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">
                    {area.postal_code && `Kode Pos: ${area.postal_code}`}
                  </div>
                  <div className="text-xs text-gray-600">
                    {area.total_customers} pelanggan • {area.assigned_officers.length} petugas
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Actions & Current Assignments */}
        <div className="space-y-6">
          {/* Action Panel */}
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">Aksi Penugasan</h3>
            <div className="space-y-3">
              {assignmentMode === 'single' ? (
                <button
                  onClick={handleSingleAssignment}
                  disabled={!selectedOfficer || !selectedArea}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none font-medium"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Tugaskan Petugas
                </button>
              ) : (
                <>
                  <button
                    onClick={addToBulkAssignment}
                    disabled={!selectedOfficer || !selectedArea}
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah ke Daftar
                  </button>
                  <button
                    onClick={handleBulkAssignment}
                    disabled={bulkAssignments.length === 0}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none font-medium"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Proses Semua ({bulkAssignments.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bulk Assignment List */}
          {assignmentMode === 'bulk' && (
            <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-black">Daftar Penugasan</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bulkAssignments.map((assignment, index) => (
                  <div key={index} className="bg-[#e0e5ec] p-3 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-black">{getOfficerName(assignment.officer_id)}</div>
                      <div className="text-sm text-gray-700">{getAreaName(assignment.area_id)}</div>
                    </div>
                    <button
                      onClick={() => removeFromBulkAssignment(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-[#d1d6dc] transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {bulkAssignments.length === 0 && (
                  <div className="text-center py-4 text-gray-600">
                    Belum ada penugasan dalam daftar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">Statistik Cepat</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="text-center bg-[#e0e5ec] rounded-xl p-3 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
                <div className="text-2xl font-bold text-blue-600">{unassignedOfficers.length}</div>
                <div className="text-gray-700 font-medium">Petugas Belum Ditugaskan</div>
              </div>
              <div className="text-center bg-[#e0e5ec] rounded-xl p-3 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
                <div className="text-2xl font-bold text-orange-600">{areasWithoutOfficers.length}</div>
                <div className="text-gray-700 font-medium">Area Tanpa Petugas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Management */}
      <AssignmentManagement
        areas={areas}
        onUnassign={handleUnassignment}
        onTransfer={transferOfficer}
        onRefresh={() => {
          refreshAreas();
          refreshOfficers();
        }}
      />
    </main>
  );
}
