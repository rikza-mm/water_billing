'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PayCustomerDebtForm from '@/components/petugas/history/[customerId]/PayCustomerDebtForm';
import { toast } from 'react-hot-toast';
import { getCustomerHistoryForPdf, type CustomerHistoryData } from '@/services/customerHistoryService';
import DebtPaymentReceipt from '@/components/petugas/history/[customerId]/DebtPaymentReceipt';
import { DebtPaymentData } from '@/utils/debtPaymentReceiptPdfGenerator';

export default function PayDebtPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;

  const [hutang, setHutang] = useState<number>(0);
  const [customer, setCustomer] = useState<{ name: string; address: string; area: string; phone?: string; saldo?: number; hutang?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'receipt'>('form');
  const [payment, setPayment] = useState<DebtPaymentData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const historyData: CustomerHistoryData = await getCustomerHistoryForPdf(customerId);
        setHutang(historyData.financialSummary?.hutang ?? 0);
        setCustomer({
          name: historyData.financialSummary?.customerName || '',
          address: historyData.financialSummary?.address || '',
          area: historyData.financialSummary?.area || '',
          phone: historyData.financialSummary?.phone || '',
          saldo: historyData.financialSummary?.saldo ?? 0,
          hutang: historyData.financialSummary?.hutang ?? 0,
        });
      } catch {
        toast.error('Gagal memuat data pelanggan');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    if (customerId) fetchData();
  }, [customerId, router]);

  const handleSuccess = (paymentData: DebtPaymentData) => {
    setPayment(paymentData);
    setStep('receipt');
  };

  if (loading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec]">
        <div className="text-gray-600 text-lg">Memuat data hutang...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec] p-4">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header & Info Pelanggan */}
        <div className="bg-[#e0e5ec] rounded-xl p-6 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] mb-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Hutang Pelanggan</h2>
          {customer && (
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-semibold">Nama:</span> {customer.name}</div>
              <div><span className="font-semibold">Alamat:</span> {customer.address}</div>
              <div><span className="font-semibold">Area:</span> {customer.area}</div>
              {customer.phone && <div><span className="font-semibold">No. HP:</span> {customer.phone}</div>}
            </div>
          )}
        </div>
        {/* Form Pembayaran Hutang atau Receipt */}
        {step === 'form' && customer && (
          <PayCustomerDebtForm
            customerId={customerId}
            hutang={hutang}
            customerData={customer} // <-- KIRIM DATA CUSTOMER LENGKAP
            onSuccess={handleSuccess}
            onClose={() => router.back()}
          />
        )}
        {step === 'receipt' && payment && (
          <DebtPaymentReceipt
            customer={{
              id: customerId,
              name: customer.name,
              address: customer.address,
              saldo: payment.newBalance ?? (typeof customer.saldo === 'number' ? customer.saldo : 0) ?? 0,
              hutang: payment.newDebt ?? (typeof customer.hutang === 'number' ? customer.hutang : hutang) ?? 0,
              phone: customer.phone,
            }}
            payment={payment}
            onFinish={() => router.replace(`/petugas/history/${customerId}`)}
          />
        )}
      </div>
    </div>
  );
}
