'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import Image from 'next/image';
import { Calendar, User, Eye, Camera, MessageSquare } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

interface DetailedHistory {
  id: string;
  customerId: string;
  customerName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  meterStart: string;
  meterEnd: string;
  waterUsage: string;
  billAmount: string;
  paymentStatus: string;
  paymentDate?: string;
  paymentMethod?: string;
  officerName: string;
  readingDate: string;
  notes?: string;
  proofImage?: string;
  remainingDebt: string;
  paidAmount: string;
  dueDate: string;
  lateFee?: string;
  totalDue: string;
  monthYear: string;
  isOverdue: boolean;
  daysPastDue?: string;
  ratePerCubic?: string;
  payment_id?: number | null;
}

interface DetailedHistoryTableProps {
  detailedHistory: DetailedHistory[];
  formatDate: (dateString: string) => string;
  onViewDetails: (paymentId: number) => void;
}

export default function DetailedHistoryTable({ detailedHistory, formatDate, onViewDetails }: DetailedHistoryTableProps) {
  const [openImage, setOpenImage] = useState<null | { url: string; info: string; officer: string; date: string }>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const toggleNotesExpansion = (itemId: string) => {
    setExpandedNotesId(currentId => (currentId === itemId ? null : itemId));
  };

  return (
    <>
      {/* Modal Preview Gambar */}
      <Modal 
        isOpen={!!openImage} 
        onClose={() => setOpenImage(null)}
        title="Foto Bukti Pembayaran"
      >
        {openImage && (
          <div className="p-4">
            <div className="mb-4">
              <Image 
                src={openImage.url} 
                alt="Foto Bukti Pembayaran" 
                width={400} 
                height={300} 
                className="w-full rounded-lg shadow-lg" 
                style={{objectFit:'contain'}} 
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Periode: {openImage.info}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>Petugas: {openImage.officer}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Tanggal Baca: {openImage.date}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Tabel Riwayat Detail */}
      <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">Riwayat Tagihan Detail</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#e0e5ec]">
            <thead className="bg-[#d1d5dc]">
              <tr className="text-gray-700 text-sm">
                <th className="py-3 px-4 text-left font-semibold w-1/6">Periode</th>
                <th className="py-3 px-4 text-left font-semibold w-1/6">Pemakaian</th>
                <th className="py-3 px-4 text-left font-semibold w-1/12">Tagihan</th>
                <th className="py-3 px-4 text-left font-semibold w-1/12">Dibayar</th>
                <th className="py-3 px-4 text-left font-semibold w-1/12">Hutang</th>
                <th className="py-3 px-4 text-left font-semibold w-1/12">Status</th>
                <th className="py-3 px-4 text-left font-semibold w-1/6">Tgl Bayar</th>
                <th className="py-3 px-4 text-center font-semibold w-1/4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c9d1]">
              {detailedHistory.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-[#d1d5dc]/60 transition-colors duration-200 text-sm">
                    <td className="py-3 px-4 text-gray-700">
                      <div className="font-medium">{item.period}</div>
                      {/* ✅ LANGSUNG TAMPILKAN STRING, JANGAN DI-FORMAT ULANG */}
                      <div className="text-xs text-gray-500">
                        {item.periodStart} - {item.periodEnd}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="font-medium">{item.waterUsage} m³</div>
                      <div className="text-xs text-gray-500">{item.meterStart} → {item.meterEnd}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{formatRupiah(item.billAmount)}</td>
                    <td className="py-3 px-4 font-medium text-green-600">{formatRupiah(item.paidAmount || 0)}</td>
                    <td className="py-3 px-4 font-medium text-red-600">{formatRupiah(item.remainingDebt || 0)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : item.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.paymentStatus === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : item.paymentStatus === 'cancelled'
                          ? 'bg-gray-300 text-gray-500 border border-gray-400'
                          : item.paymentStatus === 'unpaid'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {item.paymentStatus === 'paid'
                          ? 'Lunas'
                          : item.paymentStatus === 'partial'
                          ? 'Sebagian'
                          : item.paymentStatus === 'overdue'
                          ? 'Terlambat'
                          : item.paymentStatus === 'cancelled'
                          ? 'Dibatalkan'
                          : item.paymentStatus === 'unpaid'
                          ? 'Belum Bayar'
                          : item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{item.paymentDate ? formatDate(item.paymentDate) : '-'}</td>
                    <td className="py-2 px-4 text-center">
                      {/* 1. Wrapper untuk menengahkan grup tombol */}
                      <div className="flex justify-center">
                        {/* 2. Container grid dibuat 'inline' dan gap diperkecil */}
                        <div className="inline-grid grid-cols-3 items-center gap-0.5">
                          
                          {/* Slot 1: Tombol Catatan */}
                          <div className="flex justify-center">
                            {item.notes ? (
                              <button
                                onClick={() => toggleNotesExpansion(item.id)}
                                className="p-2 rounded-lg bg-[#e0e5ec] text-gray-600 shadow-neumorph hover:shadow-neumorph-pressed transition-all"
                                title="Lihat Catatan"
                              >
                                <MessageSquare size={16} />
                              </button>
                            ) : (
                              <div className="w-9 h-9" />
                            )}
                          </div>

                          {/* Slot 2: Tombol Bukti */}
                          <div className="flex justify-center">
                            {item.proofImage ? (
                              <button
                                onClick={() => setOpenImage({
                                  url: item.proofImage!,
                                  info: `Foto Meter Periode ${item.period}`,
                                  officer: item.officerName,
                                  date: item.readingDate
                                })}
                                className="p-2 rounded-lg bg-[#e0e5ec] text-blue-600 shadow-neumorph hover:shadow-neumorph-pressed transition-all"
                                title="Lihat Foto Meteran"
                              >
                                <Camera size={16} />
                              </button>
                            ) : (
                              <div className="w-9 h-9" />
                            )}
                          </div>

                          {/* Slot 3: Tombol Detail */}
                          <div className="flex justify-center">
                            {item.payment_id ? (
                              <button
                                onClick={() => onViewDetails(item.payment_id!)}
                                className="py-2 px-3 rounded-lg bg-blue-500 text-white shadow-neumorph hover:bg-blue-600 transition-all flex items-center gap-1.5 text-xs font-semibold"
                                title="Lihat Detail Pembayaran"
                              >
                                <Eye size={16} /> <span>Detail</span>
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>

                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Baris Catatan yang Diperluas */}
                  {expandedNotesId === item.id && item.notes && (
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="p-4 text-sm">
                        <div className="flex items-start gap-3 text-blue-800">
                          <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Catatan Petugas:</p>
                            <p className="whitespace-pre-wrap">{item.notes}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}