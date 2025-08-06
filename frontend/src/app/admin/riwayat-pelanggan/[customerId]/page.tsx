'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAdminCustomerHistory } from '@/hooks/admin/history/useAdminCustomerHistory';
import PaymentDetailModal from '@/components/admin/riwayat-pelanggan/[custmerid]/PaymentDetailModal';
import CustomerInfoHeader from '@/components/admin/riwayat-pelanggan/[custmerid]/CustomerInfoHeader';
import FinancialSummary from '@/components/admin/riwayat-pelanggan/[custmerid]/FinancialSummary';
import DetailedHistoryTable from '@/components/admin/riwayat-pelanggan/[custmerid]/DetailedHistoryTable';
import MobileActionButtons from '@/components/admin/riwayat-pelanggan/[custmerid]/MobileActionButtons';
import DebtHistoryTable from '@/components/admin/riwayat-pelanggan/[custmerid]/DebtHistoryTable';

export default function AdminCustomerDetailHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  // Konsistenkan destructuring pada useAdminCustomerHistory di detail customer
  const {
    historyData,
    fetchCustomerHistory,
    isDetailLoading,
    paymentDetails,
    fetchPaymentDetails,
  } = useAdminCustomerHistory();

  // State untuk modal detail pembayaran
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk screen size
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallScreen: false,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isSmallScreen: window.innerWidth < 640,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data utama saat komponen dimuat
  useEffect(() => {
    if (customerId) {
      fetchCustomerHistory(customerId);
    }
  }, [customerId, fetchCustomerHistory]);

  const { isMobile, isSmallScreen } = screenSize;

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    if (customerId) {
      fetchCustomerHistory(customerId);
      toast.success('Data berhasil diperbarui');
    }
  };

  const handleExport = () => {
    toast.success('Fitur export akan segera tersedia');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Riwayat ${historyData?.customerProfile.customerName}`,
        text: `Detail riwayat tagihan pelanggan ${historyData?.customerProfile.customerName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link berhasil disalin');
    }
  };

  // Fungsi untuk handle klik detail pembayaran
  const handleViewPaymentDetails = (paymentId: number) => {
    setIsModalOpen(true);
    fetchPaymentDetails(paymentId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center"></div>
    );
  }

  return (
    <div
      className={`
      min-h-screen bg-[#e0e5ec]
      ${isMobile ? 'p-3' : 'p-4 sm:p-6'}
      space-y-4 sm:space-y-6
    `}
    >
      {/* Header dengan Customer Info */}
      <CustomerInfoHeader
        customerFinancialSummary={historyData ? {
          customerName: historyData.customerProfile.customerName,
          address: historyData.customerProfile.address,
          phone: historyData.customerProfile.phone,
          meterNumber: historyData.customerProfile.meterNumber,
          area: historyData.customerProfile.area,
          saldo: Number(historyData.customerProfile.saldo),
          hutang: Number(historyData.customerProfile.hutang),
          totalDebt: Number(historyData.financialSummary.totalHutang),
          partialDebt: 0,
          totalPaid: Number(historyData.financialSummary.totalDibayar),
          totalLateFees: 0,
          calculatedDebt: Number(historyData.financialSummary.totalHutang),
          unpaidBillsCount: historyData.billingHistory.filter(b => b.status === 'unpaid').length,
          paidBillsCount: historyData.billingHistory.filter(b => b.status === 'paid').length,
          partialBillsCount: historyData.billingHistory.filter(b => b.status === 'partial').length,
          averageBillAmount: historyData.financialSummary.rataRataTagihan,
          lastPaymentDate: historyData.billingHistory.find(b => b.status === 'paid')?.tgl_bayar || undefined,
          earliestDueDate: historyData.billingHistory.find(b => b.status === 'unpaid')?.jatuh_tempo || undefined,
        } : null}
        isMobile={isMobile}
        isSmallScreen={isSmallScreen}
        loading={isDetailLoading}
        onBack={handleBack}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onPrint={handlePrint}
        onShare={handleShare}
      />

      {/* Financial Summary */}
      {historyData && (
        <FinancialSummary customerFinancialSummary={{
          customerName: historyData.customerProfile.customerName,
          address: historyData.customerProfile.address,
          phone: historyData.customerProfile.phone,
          meterNumber: historyData.customerProfile.meterNumber,
          area: historyData.customerProfile.area,
          saldo: Number(historyData.customerProfile.saldo),
          hutang: Number(historyData.customerProfile.hutang),
          totalDebt: Number(historyData.financialSummary.totalHutang),
          partialDebt: 0,
          totalPaid: Number(historyData.financialSummary.totalDibayar),
          totalLateFees: 0,
          calculatedDebt: Number(historyData.financialSummary.totalHutang),
          unpaidBillsCount: historyData.billingHistory.filter(b => b.status === 'unpaid').length,
          paidBillsCount: historyData.billingHistory.filter(b => b.status === 'paid').length,
          partialBillsCount: historyData.billingHistory.filter(b => b.status === 'partial').length,
          averageBillAmount: historyData.financialSummary.rataRataTagihan,
          lastPaymentDate: historyData.billingHistory.find(b => b.status === 'paid')?.tgl_bayar || undefined,
          earliestDueDate: historyData.billingHistory.find(b => b.status === 'unpaid')?.jatuh_tempo || undefined,
        }} />
      )}

      {/* Modal Detail Pembayaran */}
      <PaymentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        details={paymentDetails}
        isLoading={isDetailLoading}
      />

      {/* Tabel Riwayat Tagihan & Hutang */}
      {!isDetailLoading && historyData && (
        <div className="space-y-6">
          {/* FinancialSummary sudah di atas, tidak perlu diulang */}

          <DetailedHistoryTable
            detailedHistory={historyData.billingHistory.map(b => {
              const periodeDate = new Date(b.periode);
              const monthYear = periodeDate.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric'
              });
              const periodStartDate = new Date(periodeDate.getFullYear(), periodeDate.getMonth(), 1);
              const periodEndDate = new Date(periodeDate.getFullYear(), periodeDate.getMonth() + 1, 0);
              return {
                id: String(b.bill_id),
                customerId: customerId,
                customerName: historyData.customerProfile.customerName,
                period: monthYear,
                periodStart: periodStartDate.toLocaleDateString('id-ID'),
                periodEnd: periodEndDate.toLocaleDateString('id-ID'),
                meterStart: String(b.previous_reading || '0'),
                meterEnd: String(b.current_reading || '0'),
                waterUsage: String(b.pemakaian),
                billAmount: String(b.jumlah),
                paymentStatus: b.status,
                paymentDate: b.tgl_bayar || undefined,
                paymentMethod: b.metode || undefined,
                officerName: b.petugas_kasir.full_name || b.petugas_pencatat.full_name || '',
                readingDate: b.tgl_bayar || '',
                notes: (b.catatan_meter || b.catatan_tagihan) ?? undefined,
                proofImage: b.bukti_meter ?? undefined,
                remainingDebt: String(b.sisa),
                paidAmount: String(b.dibayar),
                dueDate: b.jatuh_tempo,
                monthYear: monthYear,
                isOverdue: b.status === 'overdue',
                payment_id: b.payment_id,
                totalDue: String(b.jumlah)
              };
            })}
            formatDate={formatDate}
            onViewDetails={handleViewPaymentDetails}
          />

          {/* ✅ 2. Tambahkan komponen baru di sini */}
          <DebtHistoryTable
            debtHistory={historyData.debtHistory}
            formatDate={formatDate}
            onViewDetails={handleViewPaymentDetails}
          />
        </div>
      )}

      {isMobile && (
        <MobileActionButtons
          onExport={handleExport}
          onPrint={handlePrint}
          onShare={handleShare}
        />
      )}

      {isMobile && <div className="h-20" />}
    </div>
  );
}
