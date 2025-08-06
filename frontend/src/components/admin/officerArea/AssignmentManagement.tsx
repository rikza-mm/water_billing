"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import {
  Trash2,
  ArrowRightLeft,
  User,
  MapPin,
  AlertTriangle,
  X,
  Users,
  CheckSquare,
  Square,
  Trash
} from 'lucide-react';

interface Officer {
  user_id: number;
  full_name: string;
  username: string;
  phone_number: string;
  total_customers: number;
}

interface Area {
  area_id: number;
  area_name: string;
  postal_code?: string;
  total_customers: number;
  assigned_officers: Officer[];
}

interface AssignmentManagementProps {
  areas: Area[];
  onUnassign: (areaId: number, officerId: number) => Promise<void>;
  onTransfer: (officerId: number, fromAreaId: number, toAreaId: number) => Promise<void>;
  onRefresh: () => void;
}

export default function AssignmentManagement({
  areas,
  onUnassign,
  onTransfer,
  onRefresh
}: AssignmentManagementProps) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    officer: Officer;
    area: Area;
  } | null>(null);
  const [targetAreaId, setTargetAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());

  const assignedAreas = areas.filter(area => area.assigned_officers.length > 0);

  const handleDeleteClick = (officer: Officer, area: Area) => {
    setSelectedAssignment({ officer, area });
    setShowDeleteModal(true);
  };

  const handleTransferClick = (officer: Officer, area: Area) => {
    setSelectedAssignment({ officer, area });
    setTargetAreaId(null);
    setShowTransferModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAssignment) return;

    setLoading(true);
    try {
      await onUnassign(selectedAssignment.area.area_id, selectedAssignment.officer.user_id);
      toast.success(`${selectedAssignment.officer.full_name} berhasil dihapus dari ${selectedAssignment.area.area_name}`);
      setShowDeleteModal(false);
      setSelectedAssignment(null);
      onRefresh();
    } catch {
      toast.error('Gagal menghapus penugasan');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedAssignment || !targetAreaId) return;

    setLoading(true);
    try {
      await onTransfer(
        selectedAssignment.officer.user_id,
        selectedAssignment.area.area_id,
        targetAreaId
      );

      const targetArea = areas.find(a => a.area_id === targetAreaId);
      toast.success(
        `${selectedAssignment.officer.full_name} berhasil dipindah dari ${selectedAssignment.area.area_name} ke ${targetArea?.area_name}`
      );

      setShowTransferModal(false);
      setSelectedAssignment(null);
      setTargetAreaId(null);
      onRefresh();
    } catch {
      toast.error('Gagal memindahkan petugas');
    } finally {
      setLoading(false);
    }
  };

  const availableTargetAreas = areas.filter(area =>
    area.area_id !== selectedAssignment?.area.area_id
  );

  const toggleBulkSelection = (officerId: number, areaId: number) => {
    const key = `${officerId}-${areaId}`;
    const newSelected = new Set(selectedAssignments);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedAssignments(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.size === getTotalAssignments()) {
      setSelectedAssignments(new Set());
    } else {
      const allKeys = new Set<string>();
      assignedAreas.forEach(area => {
        area.assigned_officers.forEach(officer => {
          allKeys.add(`${officer.user_id}-${area.area_id}`);
        });
      });
      setSelectedAssignments(allKeys);
    }
  };

  const getTotalAssignments = () => {
    return assignedAreas.reduce((total, area) => total + area.assigned_officers.length, 0);
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.size === 0) return;

    setLoading(true);
    try {
      const promises = Array.from(selectedAssignments).map(key => {
        const [officerId, areaId] = key.split('-').map(Number);
        return onUnassign(areaId, officerId);
      });

      await Promise.all(promises);
      toast.success(`${selectedAssignments.size} penugasan berhasil dihapus`);
      setSelectedAssignments(new Set());
      setShowBulkDeleteModal(false);
      setBulkMode(false);
      onRefresh();
    } catch {
      toast.error('Gagal menghapus beberapa penugasan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-black flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Kelola Penugasan Aktif
        </h2>

        <div className="flex items-center gap-3">
          {bulkMode && selectedAssignments.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Hapus ({selectedAssignments.size})
            </button>
          )}

          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedAssignments(new Set());
            }}
            className={`px-4 py-2 rounded-xl transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] ${
              bulkMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {bulkMode ? 'Batal Bulk' : 'Mode Bulk'}
          </button>
        </div>
      </div>

      {bulkMode && assignedAreas.length > 0 && (
        <div className="mb-4 p-3 bg-[#e0e5ec] rounded-xl shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              {selectedAssignments.size === getTotalAssignments() ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {selectedAssignments.size === getTotalAssignments() ? 'Batalkan Semua' : 'Pilih Semua'}
              </span>
            </button>
            <span className="text-sm text-gray-600">
              {selectedAssignments.size} dari {getTotalAssignments()} dipilih
            </span>
          </div>
        </div>
      )}

      {assignedAreas.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">Belum ada penugasan aktif</p>
          <p className="text-gray-500 text-sm">Mulai dengan menugaskan petugas ke area</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedAreas.map((area) => (
            <div key={area.area_id} className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              <div className="mb-3">
                <h3 className="font-semibold text-black flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  {area.area_name}
                </h3>
                {area.postal_code && (
                  <p className="text-xs text-gray-600">Kode Pos: {area.postal_code}</p>
                )}
                <p className="text-xs text-gray-600">{area.total_customers} pelanggan</p>
              </div>

              <div className="space-y-2">
                {area.assigned_officers.map((officer) => {
                  const assignmentKey = `${officer.user_id}-${area.area_id}`;
                  const isSelected = selectedAssignments.has(assignmentKey);

                  return (
                    <div
                      key={officer.user_id}
                      className={`bg-[#e0e5ec] p-3 rounded-lg transition-all ${
                        bulkMode
                          ? isSelected
                            ? 'shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] border-2 border-blue-500'
                            : 'shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] hover:shadow-[1px_1px_2px_#bebebe,-1px_-1px_2px_#ffffff] cursor-pointer'
                          : 'shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]'
                      }`}
                      onClick={bulkMode ? () => toggleBulkSelection(officer.user_id, area.area_id) : undefined}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2 flex-1">
                          {bulkMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBulkSelection(officer.user_id, area.area_id);
                              }}
                              className="mt-1"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          )}

                          <div className="flex-1">
                            <div className="font-medium text-black text-sm flex items-center">
                              <User className="h-3 w-3 mr-1 text-green-600" />
                              {officer.full_name}
                            </div>
                            <div className="text-xs text-gray-600">{officer.username}</div>
                            <div className="text-xs text-gray-600">{officer.phone_number}</div>
                            <div className="text-xs text-blue-600 font-medium">
                              {officer.total_customers} pelanggan
                            </div>
                          </div>
                        </div>

                        {!bulkMode && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleTransferClick(officer, area)}
                              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-[#d1d6dc] rounded transition-colors"
                              title="Pindah Area"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(officer, area)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-[#d1d6dc] rounded transition-colors"
                              title="Hapus Penugasan"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssignment && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 w-screen h-screen z-0 backdrop-blur-[6px] bg-black/20" onClick={() => { setShowDeleteModal(false); setSelectedAssignment(null); }}></div>
          <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-md mx-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-black">Konfirmasi Hapus Penugasan</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Apakah Anda yakin ingin menghapus penugasan:
              </p>
              <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
                <p className="font-medium text-black">{selectedAssignment.officer.full_name}</p>
                <p className="text-sm text-gray-600">dari area {selectedAssignment.area.area_name}</p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ {selectedAssignment.officer.total_customers} pelanggan akan kehilangan petugas
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                {loading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAssignment(null);
                }}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedAssignment && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 w-screen h-screen z-0 backdrop-blur-[6px] bg-black/20" onClick={() => { setShowTransferModal(false); setSelectedAssignment(null); setTargetAreaId(null); }}></div>
          <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-md mx-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ArrowRightLeft className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-black">Pindah Area Petugas</h3>
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedAssignment(null);
                  setTargetAreaId(null);
                }}
                className="p-1 hover:bg-[#d1d6dc] rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] mb-4">
                <p className="font-medium text-black">{selectedAssignment.officer.full_name}</p>
                <p className="text-sm text-gray-600">
                  Dari: {selectedAssignment.area.area_name}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedAssignment.officer.total_customers} pelanggan akan dipindah
                </p>
              </div>

              <label className="block text-sm font-medium text-black mb-2">
                Pilih Area Tujuan:
              </label>
              <select
                value={targetAreaId || ''}
                onChange={(e) => setTargetAreaId(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] outline-none text-black"
              >
                <option value="">Pilih area tujuan...</option>
                {availableTargetAreas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name} ({area.assigned_officers.length} petugas, {area.total_customers} pelanggan)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmTransfer}
                disabled={loading || !targetAreaId}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                {loading ? 'Memindahkan...' : 'Pindahkan'}
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedAssignment(null);
                  setTargetAreaId(null);
                }}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 w-screen h-screen z-0 backdrop-blur-[6px] bg-black/20" onClick={() => setShowBulkDeleteModal(false)}></div>
          <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-md mx-4 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-black">Konfirmasi Hapus Massal</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Apakah Anda yakin ingin menghapus {selectedAssignments.size} penugasan yang dipilih?
              </p>
              <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
                <p className="text-xs text-red-600">
                  ⚠️ Tindakan ini akan menghapus semua penugasan yang dipilih dan tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                {loading ? 'Menghapus...' : `Ya, Hapus ${selectedAssignments.size} Penugasan`}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 transition-all shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] disabled:shadow-none"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
