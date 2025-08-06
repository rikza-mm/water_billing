"use client";

import { Users, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

interface AssignmentStatusCardProps {
  totalOfficers: number;
  assignedOfficers: number;
  totalAreas: number;
  areasWithOfficers: number;
  unassignedOfficers: number;
  areasWithoutOfficers: number;
}

export default function AssignmentStatusCard({
  totalOfficers,
  assignedOfficers,
  totalAreas,
  areasWithOfficers,
  unassignedOfficers,
  areasWithoutOfficers
}: AssignmentStatusCardProps) {
  const officerAssignmentRate = totalOfficers > 0 ? (assignedOfficers / totalOfficers) * 100 : 0;
  const areaAssignmentRate = totalAreas > 0 ? (areasWithOfficers / totalAreas) * 100 : 0;

  return (
    <div className="bg-[#e0e5ec] rounded-xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] p-6 mb-6">
      <h3 className="text-xl font-semibold text-black mb-6">Status Penempatan Area</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Officers */}
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Petugas</p>
              <p className="text-2xl font-bold text-blue-800">{totalOfficers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Assigned Officers */}
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Petugas Ditugaskan</p>
              <p className="text-2xl font-bold text-green-800">{assignedOfficers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Total Areas */}
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Area</p>
              <p className="text-2xl font-bold text-purple-800">{totalAreas}</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Areas with Officers */}
        <div className="bg-[#e0e5ec] rounded-xl p-4 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Area Berpetugas</p>
              <p className="text-2xl font-bold text-indigo-800">{areasWithOfficers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Officer Assignment Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-black">Tingkat Penugasan Petugas</span>
            <span className="text-sm text-gray-700">{officerAssignmentRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${officerAssignmentRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {assignedOfficers} dari {totalOfficers} petugas telah ditugaskan
          </p>
        </div>

        {/* Area Coverage Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-black">Cakupan Area</span>
            <span className="text-sm text-gray-700">{areaAssignmentRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${areaAssignmentRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {areasWithOfficers} dari {totalAreas} area memiliki petugas
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(unassignedOfficers > 0 || areasWithoutOfficers > 0) && (
        <div className="space-y-3">
          {unassignedOfficers > 0 && (
            <div className="bg-[#e0e5ec] border-l-4 border-yellow-400 p-4 rounded-r-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-black">
                    {unassignedOfficers} petugas belum ditugaskan ke area manapun
                  </p>
                  <p className="text-xs text-gray-700">
                    Segera tugaskan petugas untuk memastikan pelayanan optimal
                  </p>
                </div>
              </div>
            </div>
          )}

          {areasWithoutOfficers > 0 && (
            <div className="bg-[#e0e5ec] border-l-4 border-red-400 p-4 rounded-r-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-black">
                    {areasWithoutOfficers} area tidak memiliki petugas
                  </p>
                  <p className="text-xs text-gray-700">
                    Area tanpa petugas dapat mengganggu operasional layanan
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {unassignedOfficers === 0 && areasWithoutOfficers === 0 && totalOfficers > 0 && totalAreas > 0 && (
        <div className="bg-[#e0e5ec] border-l-4 border-green-400 p-4 rounded-r-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-black">
                Semua petugas dan area telah ditugaskan dengan baik
              </p>
              <p className="text-xs text-gray-700">
                Sistem penempatan area berjalan optimal
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
