'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  User,
  MapPin,
  DollarSign,
  AlertTriangle,
  Download,
  Printer,
  Share2,
  ListChecks,
  Landmark,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { useHistoryDashboard } from '@/hooks/petugas/history/useHistoryDashboard';
import DetailedHistoryTable from '@/components/petugas/history/[customerId]/DetailedHistoryTable';
import BillingPaymentInfo from '@/components/petugas/history/[customerId]/BillingPaymentInfo';
import DebtHistoryTable from '@/components/petugas/history/[customerId]/DebtHistoryTable';
import { toast } from 'react-hot-toast';
import { getCustomerHistoryForPdf } from '@/services/customerHistoryService';
import { generateCustomerHistoryPdf } from '@/utils/customerHistoryPdfGenerator';
import { uploadPdfToCloudinary } from '@/utils/directUploader';
import type { DetailedHistory } from '@/hooks/petugas/history/useHistoryDashboard';

// ✅ Pastikan tipe Payment bisa menangani pembayaran hutang

export default function CustomerDetailHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const {
    loading,
    detailedHistory,
    customerFinancialSummary,
    fetchAllHistory,
    debtHistory,
    formatCurrency,
    formatDate,
  } = useHistoryDashboard();

  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallScreen: false
  });

  const [activeTab, setActiveTab] = useState<'tagihan' | 'hutang'>('tagihan');
  
  // HAPUS: isDebtModalOpen, selectedCustomerForDebt, latestDebtPayment

  // Tambahkan state untuk kirim riwayat
  const [isSendingHistory, setIsSendingHistory] = useState(false);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isSmallScreen: window.innerWidth < 640
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (customerId) {
      fetchAllHistory(customerId);
    }
  }, [customerId, fetchAllHistory]);

  const { isMobile, isSmallScreen } = screenSize;

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    if (customerId) {
      fetchAllHistory(customerId);
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
        title: `Riwayat ${customerFinancialSummary?.customerName}`,
        text: `Detail riwayat tagihan pelanggan ${customerFinancialSummary?.customerName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link berhasil disalin');
    }
  };

  // --- Handler baru untuk redirect pembayaran hutang ---
  const handleRedirectToPayDebt = () => {
    router.push(`/petugas/history/${customerId}/pay-debt`);
  };

  // Handler pembayaran tagihan (harus ada untuk onPayBillClick)
  const handleRedirectToPayPage = (bill: DetailedHistory) => {
    router.push(`/petugas/history/${customerId}/pay/${bill.bill_id}`);
  };

  // Tambahkan fungsi untuk ambil riwayat
  const loadCustomerHistory = useCallback(async () => {
    if (!customerFinancialSummary) return;
    
    try {
      await getCustomerHistoryForPdf(customerId);
    } catch {
      toast.error('Gagal memuat riwayat pelanggan');
    }
  }, [customerFinancialSummary, customerId]);

  // Tambahkan fungsi untuk kirim riwayat ke WhatsApp
  const handleSendHistoryToWhatsApp = async () => {
    if (!customerFinancialSummary) {
      toast.error('Data pelanggan tidak tersedia');
      return;
    }

    const customerPhone = customerFinancialSummary.phone;
    if (!customerPhone) {
      toast.error('Nomor WhatsApp pelanggan tidak tersedia');
      return;
    }

    setIsSendingHistory(true);
    toast.loading('Membuat & mengunggah riwayat...');

    try {
      // Ambil data riwayat lengkap
      const historyData = await getCustomerHistoryForPdf(customerId);
      
      // Generate PDF riwayat
      const historyBlob = generateCustomerHistoryPdf(
        {
          id: customerId,
          name: customerFinancialSummary.customerName,
          address: customerFinancialSummary.address,
          phoneNumber: customerFinancialSummary.phone,
          meterNumber: customerFinancialSummary.meterNumber,
          saldo: customerFinancialSummary.saldo,
          hutang: customerFinancialSummary.hutang,
        },
        historyData,
        'blob'
      ) as Blob;

      // Upload ke Cloudinary
      const fileName = `riwayat-lengkap-${customerId}-${Date.now()}.pdf`;
      const historyUrl = await uploadPdfToCloudinary(historyBlob, fileName, 'reports');

      // Kirim ke WhatsApp
      const message = `Yth. Bpk/Ibu ${customerFinancialSummary.customerName},\n\nBerikut adalah riwayat lengkap tagihan air Anda:\n\n${historyUrl}\n\nSalam,\nTirta Muna`;
      const encodedMessage = encodeURIComponent(message);
      const formattedPhone = customerPhone.replace(/^0/, '62');
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      toast.dismiss();
      toast.success('Riwayat berhasil dikirim ke WhatsApp');

    } catch (error) {
      toast.dismiss();
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(`Gagal mengirim riwayat: ${message}`);
    } finally {
      setIsSendingHistory(false);
    }
  };

  // Tambahkan useEffect untuk load riwayat saat komponen mount
  useEffect(() => {
    loadCustomerHistory();
  }, [customerFinancialSummary, customerId, loadCustomerHistory]);

  // ✅ Prevent body scroll when modal is open
  useEffect(() => {
    // HAPUS: isDebtModalOpen
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (!customerId) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Customer ID tidak ditemukan</h2>
          <button
            onClick={handleBack}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-[#e0e5ec]
      ${isMobile ? 'p-3' : 'p-4 sm:p-6'}
      space-y-4 sm:space-y-6
    `}>
      {/* Header */}
      <div className={`
        bg-[#e0e5ec] rounded-xl
        ${isMobile ? 'p-4' : 'p-6'}
        shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
        sm:shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
      `}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className={`
                bg-[#e0e5ec] rounded-lg
                ${isMobile ? 'p-2' : 'p-3'}
                shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
                hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
                transition-all duration-200
              `}
            >
              <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-600`} />
            </button>
            <div>
              <h1 className={`
                ${isSmallScreen ? 'text-lg' : 'text-xl sm:text-2xl'}
                font-semibold text-gray-800
              `}>
                Detail Riwayat Pelanggan
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`
                bg-[#e0e5ec] rounded-lg
                ${isMobile ? 'p-2' : 'p-3'}
                shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
                hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
                transition-all duration-200
                disabled:opacity-50
              `}
            >
              <RefreshCw className={`
                ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}
                text-blue-600
                ${loading ? 'animate-spin' : ''}
              `} />
            </button>

            {!isMobile && (
              <>
                <button
                  onClick={handleExport}
                  className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
                >
                  <Download className="h-5 w-5 text-green-600" />
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
                >
                  <Printer className="h-5 w-5 text-purple-600" />
                </button>
                <button
                  onClick={handleShare}
                  className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200"
                >
                  <Share2 className="h-5 w-5 text-orange-600" />
                </button>
              </>
            )}
            <button
              onClick={handleSendHistoryToWhatsApp}
              disabled={isSendingHistory || !customerFinancialSummary?.phone}
              className="bg-[#e0e5ec] p-3 rounded-lg shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] transition-all duration-200 disabled:opacity-50"
              title="Kirim riwayat ke WhatsApp pelanggan"
            >
              {isSendingHistory ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <MessageCircle className="h-5 w-5 text-green-600" />
              )}
            </button>
          </div>
        </div>

        {/* Customer Quick Info */}
        {customerFinancialSummary && (
          <div className={`
            grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}
            gap-3 sm:gap-4
          `}>
            <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 text-xs font-medium">Pelanggan</span>
              </div>
              <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-gray-800 truncate`}>
                {customerFinancialSummary.customerName}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span>ID: {customerId}</span>
              </div>
            </div>

            <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-purple-600" />
                <span className="text-purple-600 text-xs font-medium">Area</span>
              </div>
              <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-gray-800 truncate`}>
                {customerFinancialSummary.area}
              </div>
              {customerFinancialSummary.address && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {customerFinancialSummary.address}
                </div>
              )}
            </div>
            
            <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 text-xs font-medium">Hutang</span>
              </div>
              <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-red-700`}>
                {formatCurrency(customerFinancialSummary.hutang)}
              </div>
            </div>

            <div className="bg-[#e0e5ec] p-3 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-green-600 text-xs font-medium">Saldo</span>
              </div>
              <div className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-green-700`}>
                {formatCurrency(customerFinancialSummary.saldo)}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={`
          bg-[#e0e5ec] rounded-xl
          ${isMobile ? 'p-6' : 'p-8'}
          shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
          text-center
        `}>
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat detail riwayat...</p>
        </div>
      ) : detailedHistory.length === 0 ? (
        <div className={`
          bg-[#e0e5ec] rounded-xl
          ${isMobile ? 'p-6' : 'p-8'}
          shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
          text-center
        `}>
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Belum Ada Riwayat
          </h3>
          <p className="text-gray-500">
            Riwayat tagihan akan muncul setelah ada pembacaan meter dan tagihan dibuat.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {customerFinancialSummary && (
            <BillingPaymentInfo
              history={detailedHistory || []}
              financialSummary={customerFinancialSummary}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onPayDebtClick={handleRedirectToPayDebt}
            />
          )}
          
          <div className="bg-[#d1d9e6] p-1 rounded-xl shadow-neumorph-inset flex space-x-1">
            <button
              onClick={() => setActiveTab('tagihan')}
              className={`w-full py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'tagihan' ? 'bg-white text-blue-600 shadow-neumorph' : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ListChecks size={16} />
                <span>Riwayat Tagihan ({detailedHistory.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hutang')}
              className={`w-full py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'hutang' ? 'bg-white text-blue-600 shadow-neumorph' : 'text-gray-600 hover:bg-white/50'
              }`}
            >
               <div className="flex items-center justify-center gap-2">
                <Landmark size={16} />
                <span>Riwayat Bayar Hutang ({debtHistory.length})</span>
              </div>
            </button>
          </div>

          <div className="relative min-h-[300px] animate-fade-in">
            {activeTab === 'tagihan' ? (
              <DetailedHistoryTable
                history={detailedHistory}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onPayBillClick={handleRedirectToPayPage}
              />
            ) : (
              <DebtHistoryTable
                history={debtHistory}
                currentDebt={customerFinancialSummary?.hutang ?? 0}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      )}

      {/* HAPUS: MODAL UNTUK PEMBAYARAN HUTANG */}
      {/* HAPUS: MODAL UNTUK PEMBAYARAN TAGIHAN TUNGGAL */}
    </div>
  );
}
