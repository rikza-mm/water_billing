import React from 'react';

export interface OfficerActivity {
  totalPetugasAktif: number;
  pembayaranHariIni: number;
  pembacaanMeterHariIni: number;
  pendapatanPetugasBulanIni: string;
}

interface RingkasanAktivitasPetugasProps {
  activity: OfficerActivity;
}

export default function RingkasanAktivitasPetugas({ activity }: RingkasanAktivitasPetugasProps) {
  return (
    <div className="bg-[#e0e5ec] rounded-2xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Ringkasan Aktivitas Petugas</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <p className="text-sm text-gray-600 mb-2">Total Petugas Aktif</p>
          <p className="text-2xl font-bold text-gray-800">{activity.totalPetugasAktif}</p>
        </div>
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <p className="text-sm text-gray-600 mb-2">Pembayaran Hari Ini</p>
          <p className="text-2xl font-bold text-gray-800">{activity.pembayaranHariIni}</p>
        </div>
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <p className="text-sm text-gray-600 mb-2">Pembacaan Meter Hari Ini</p>
          <p className="text-2xl font-bold text-gray-800">{activity.pembacaanMeterHariIni}</p>
        </div>
        <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
          <p className="text-sm text-gray-600 mb-2">Pendapatan Bulan Ini</p>
          <p className="text-2xl font-bold text-indigo-600">Rp {Number(activity.pendapatanPetugasBulanIni).toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
}
