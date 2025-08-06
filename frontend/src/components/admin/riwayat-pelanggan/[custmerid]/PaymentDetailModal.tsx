'use client';

import React from 'react';
import Image from 'next/image';
import { Modal } from '@/components/common/Modal'; // Asumsi Anda punya komponen Modal dasar
import { PaymentDetails } from '@/hooks/admin/history/useAdminCustomerHistory'; // Impor tipe data dari hook
import { formatRupiah, formatDateLong } from '@/utils/formatters';
import {
  Loader2,
  AlertTriangle,
  User,
  Banknote,
  Wallet,
  Camera,
  FileText,
  Download,
  Link as LinkIcon
} from 'lucide-react';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: PaymentDetails | null;
  isLoading: boolean;
}

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; isBold?: boolean }> = ({ label, value, isBold }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-500 w-2/5">{label}</span>
    <span className={`w-3/5 text-right font-medium text-gray-800 ${isBold ? 'font-bold' : ''}`}>
      {value}
    </span>
  </div>
);

export default function PaymentDetailModal({ isOpen, onClose, details, isLoading }: PaymentDetailModalProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Memuat detail pembayaran...</p>
        </div>
      );
    }

    if (!details) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="mt-4 text-gray-600">Gagal memuat data atau data tidak ditemukan.</p>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-5 space-y-5">
        {/* Customer & Officer Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><User size={16} /> Info Pihak Terkait</h3>
          <div className="text-sm space-y-2.5 p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
            <InfoRow label="Pelanggan" value={details.customer.full_name} isBold />
            <InfoRow label="ID Pelanggan" value={`#${details.customer.customer_id}`} />
            <InfoRow label="Petugas" value={details.officer.full_name} isBold />
            <InfoRow label="ID Petugas" value={`#${details.officer.user_id}`} />
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><Banknote size={16} /> Rincian Transaksi</h3>
          <div className="text-sm space-y-2.5 p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
            <InfoRow label="Waktu Transaksi" value={formatDateLong(details.transaction_date)} />
            <InfoRow label="Metode" value={details.method.toUpperCase()} />
            <InfoRow label="Jumlah Transfer/Tunai" value={formatRupiah(details.amount)} />
            <InfoRow label="Saldo Digunakan" value={formatRupiah(details.balance_used)} />
            <div className="border-t border-gray-300/70 my-2"></div>
            <InfoRow label="Total Dibayar" value={formatRupiah(details.total_payment_power)} isBold />
          </div>
        </div>

        {/* Proof of Payment */}
        {details.proof_url && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><Camera size={16} /> Bukti Pembayaran</h3>
            <div className="p-2 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] flex flex-col items-center">
              <Image src={details.proof_url} alt="Bukti Pembayaran" width={300} height={400} className="rounded-md object-contain max-h-64 w-auto" />
              <a href={details.proof_url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                <LinkIcon size={12} /> Lihat Ukuran Penuh
              </a>
            </div>
          </div>
        )}

        {/* Allocations for Debt Payment */}
        {details.allocations && details.allocations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><Wallet size={16} /> Alokasi Pembayaran Hutang</h3>
            <div className="p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300/70">
                    <th className="text-left font-medium text-gray-500 pb-1">Periode Tagihan</th>
                    <th className="text-right font-medium text-gray-500 pb-1">Jumlah Dialokasikan</th>
                  </tr>
                </thead>
                <tbody>
                  {details.allocations.map(alloc => (
                    <tr key={alloc.bill_id}>
                      <td className="py-1 text-gray-700">{alloc.bill_period}</td>
                      <td className="text-right font-medium text-gray-800">{formatRupiah(alloc.allocated_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Associated Documents */}
        {details.documents && details.documents.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><FileText size={16} /> Dokumen Terkait</h3>
            <div className="flex flex-col gap-2">
              {details.documents.map(doc => (
                <a
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left p-3 rounded-lg bg-[#e0e5ec] shadow-neumorph hover:shadow-neumorph-pressed transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {doc.document_type === 'receipt' ? 'Struk Pembayaran' : 'Riwayat Pelanggan'}
                    </span>
                  </div>
                  <Download size={16} className="text-gray-500" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detail Pembayaran #${details?.payment_id || ''}`}>
      {renderContent()}
    </Modal>
  );
}