'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PaymentForm, { CustomerData, Bill } from '@/components/petugas/meter-reading/PaymentForm';
import TransactionReceipt, { MeterReadingData, Payment } from '@/components/petugas/meter-reading/TransactionReceipt';
import { toast } from 'react-hot-toast';
import { getCustomerHistoryForPdf, type CustomerHistoryData } from '@/services/customerHistoryService';

export default function PayBillPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  const billId = params.billId as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [meterReading, setMeterReading] = useState<MeterReadingData | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'receipt'>('form');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const historyData: CustomerHistoryData = await getCustomerHistoryForPdf(customerId);
        const billsArr = historyData.detailedHistory || [];
        const billDataRaw = billsArr.find((b: { bill_id: string | number }) => String(b.bill_id) === String(billId));
        if (!billDataRaw) throw new Error('Tagihan tidak ditemukan');
        // Mapping ke tipe Bill
        const billData: Bill = {
          bill_id: String(billDataRaw.bill_id),
          amount: Number(billDataRaw.amount),
          status: billDataRaw.bill_status,
          total_due: Number(billDataRaw.amount) - Number(billDataRaw.paid_amount),
          dueDate: billDataRaw.due_date,
        };
        // Mapping ke tipe CustomerData dari financialSummary
        const summary = historyData.financialSummary;
        const customerData: CustomerData = {
          id: customerId,
          name: summary?.customerName || '',
          address: summary?.address || '',
          saldo: summary?.saldo ?? 0,
          hutang: summary?.hutang ?? 0,
          meterNumber: summary?.meterNumber || '',
          category_name: summary?.area || '',
          phoneNumber: summary?.phone || '',
        };
        // Mapping ke MeterReadingData
        const meterReadingData: MeterReadingData = {
          customerId: customerId,
          previousReading: Number(billDataRaw.previous_reading),
          currentReading: Number(billDataRaw.current_reading),
          usage: Number(billDataRaw.water_usage),
          billAmount: Number(billDataRaw.amount),
          readingDate: billDataRaw.period_end,
          photos: billDataRaw.image_url ? [billDataRaw.image_url] : [],
          billId: String(billDataRaw.bill_id),
        };
        setCustomer(customerData);
        setBill(billData);
        setMeterReading(meterReadingData);
      } catch {
        toast.error('Gagal memuat data pembayaran');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    if (customerId && billId) fetchData();
  }, [customerId, billId, router]);

  const handlePaymentSuccess = (paymentData: Payment) => {
    setPayment(paymentData);
    setStep('receipt');
  };

  if (loading || !customer || !bill || !meterReading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec]">
        <div className="text-gray-600 text-lg">Memuat data pembayaran...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec] p-4">
      <div className="w-full max-w-lg mx-auto">
        {step === 'form' && (
          <PaymentForm
            bill={bill}
            customer={customer}
            meterReading={meterReading}
            onSuccess={handlePaymentSuccess}
            onPayLater={() => router.back()}
            onCancel={() => router.back()}
          />
        )}
        {step === 'receipt' && payment && (
          <TransactionReceipt
            customer={customer}
            meterReading={meterReading}
            payment={payment}
            onNext={() => router.replace(`/petugas/history/${customerId}`)}
          />
        )}
      </div>
    </div>
  );
}
