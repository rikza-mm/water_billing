'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Info, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';


// Components
import MeterReadingForm from '@/components/petugas/meter-reading/MeterReadingForm';
import PaymentForm from '@/components/petugas/meter-reading/PaymentForm';
import TransactionReceipt from '@/components/petugas/meter-reading/TransactionReceipt';
import CustomerSearch from '@/components/petugas/meter-reading/CustomerSearch';

// Custom hooks
import { useCustomerSearch } from '@/hooks/petugas/meter-reading/useCustomerSearch';
import type { CustomerSearchResult as CustomerData } from '@/hooks/petugas/meter-reading/useCustomerSearch';
import { useMeterReadingAction } from '@/hooks/petugas/meter-reading/useMeterReadingAction';
import type { RecordAndBillRequest } from '@/hooks/petugas/meter-reading/useMeterReadingAction';
import { usePayment } from '@/hooks/petugas/meter-reading/usePayment';

// Interfaces (konsisten dan lengkap, semua properti opsional kecuali id dan name)
// Remove local CustomerData definition and import the one from PaymentForm to ensure a single source of truth
// import type { CustomerData } from '@/components/petugas/meter-reading/PaymentForm';

export interface MeterReading {
  customerId: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  billAmount: number;
  readingDate: string;
  notes?: string;
  photos?: string[];
  readingId?: string;
  billId?: string;
}

export interface Payment {
  method: 'cash' | 'transfer' | 'qris' | 'balance' | 'mixed';
  amount: number;
  proofImage?: string;
  status: 'pending' | 'completed';
  timestamp: string;
  billId?: string;
  paymentId?: string; // Pastikan ini ada
  officerName?: string; // <-- TAMBAHKAN PROPERTI INI
  useBalance?: boolean;
  allocation?: {
    debt_paid: number;
    current_bill_paid: number;
    excess_amount: number;
  };
  balanceUsed?: number;
  totalPaymentPower?: number;
  debtPaid?: number;
  excessAmount?: number;
  newBalance?: number;
  newDebt?: number;
  priority?: 'current_first' | 'debt_first' | 'balance_optimize';
  paymentAllocation?: Array<{
    bill_id: number | null;
    amount: number;
    type: 'debt_payment' | 'current_bill' | 'excess_to_balance' | 'late_fee_payment';
  }>;
  summary?: {
    total_allocated: number;
    bills_affected: number;
    debt_reduction: number;
    excess_to_balance: number;
    balance_utilized?: number;
  };
  note?: string;
  totalAllocated?: number;
  billsAffected?: number;
  debtReduction?: number;
  excessToBalance?: number;
}

// Define Bill type locally to match PaymentForm
export interface Bill {
  bill_id: string;
  amount: number;
  paid_amount?: number;
  total_due?: number;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  ratePerCubic?: number;
  waterUsage?: number;
}

export default function MeterReadingPage() {
  // State management (same as before)
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'search' | 'reading' | 'payment' | 'receipt'>('search');
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [meterReading, setMeterReading] = useState<MeterReading | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refs (same as before)
  // const lastSearchRef = useRef<{query: string, type: 'id' | 'name'} | null>(null); // unused
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionTimeRef = useRef<number>(0);
  // const lastAutoRefreshTimeRef = useRef<number>(0); // unused
  // const autoRefreshInitializedRef = useRef<boolean>(false); // unused

  // Hooks
  const meterReadingAction = useMeterReadingAction();
  const { showToast } = useToast();
  const { isOffline } = useNetworkStatus();
  
  // New modular hooks
  const { 
    loading: customerSearchLoading, 
    error: customerSearchError,
    searchCustomerById,
    searchCustomersByName
  } = useCustomerSearch();
  
  const { 
    loading: meterReadingLoading, 
    recordAndCreateBill,
  } = useMeterReadingAction();
  
  const { 
  } = usePayment();

  // Combined loading state
  // const loading = customerSearchLoading || meterReadingLoading || paymentLoading; // unused

  const handleResetWorkflow = useCallback(() => {
    setCurrentStep('search');
    setCustomer(null);
    setMeterReading(null);
    setPayment(null);
    setBill(null);
    setError('');
    setSearchResults([]);
    lastTransactionTimeRef.current = Date.now();
  }, []);

  const handlePayLater = useCallback(() => {
    showToast('info', 'Pembayaran ditunda. Tagihan bisa diakses dari halaman Riwayat Pelanggan.');
    handleResetWorkflow();
  }, [handleResetWorkflow, showToast]);

  // Customer search handler (updated to use new hook)
  const handleCustomerSearchById = useCallback(async (searchQuery: string): Promise<CustomerData | null> => {
    setError('');
    setSearchResults([]);
    const customerData = await searchCustomerById(searchQuery);
    if (customerData) {
      setSearchResults([customerData]);
      return customerData;
    } else {
      setError('Pelanggan dengan ID tersebut tidak ditemukan');
      return null;
    }
  }, [searchCustomerById]);

  const handleCustomerSearchByName = useCallback(async (searchQuery: string): Promise<CustomerData[]> => {
    setError('');
    setSearchResults([]);
    
    const results = await searchCustomersByName(searchQuery);
    if (results && results.length > 0) {
      const uniqueResults = results.filter((customer, index, self) => 
        index === self.findIndex(c => c.id === customer.id)
      );
      setSearchResults(uniqueResults);
      return uniqueResults;
    } else {
      setError('Tidak ada pelanggan dengan nama tersebut');
      return [];
    }
  }, [searchCustomersByName]);

  // Customer selection handler (same as before)
  const handleSelectCustomer = useCallback((selectedCustomer: CustomerData) => {
    setCustomer(selectedCustomer);
    setCurrentStep('reading');
  }, []);

  // Handler to update customer data (e.g., after phone update)
  const handleCustomerUpdate = (updatedCustomer: CustomerData) => {
    setCustomer(updatedCustomer);
  };

  // Meter reading submission (updated to use new hook)
  const handleMeterReadingSubmit = useCallback(async (readingDataFromForm: {
    currentReading: number;
    readingDate: string;
    notes?: string;
    photoUrl?: string;
  }) => {
    if (!customer || !readingDataFromForm.photoUrl) {
      showToast('error', 'Data pelanggan atau foto meter tidak lengkap.');
      return;
    }
    try {
      setIsUploading(true);
      // Foto sudah diunggah di komponen, tidak perlu upload ulang
      // Lanjutkan proses pencatatan dan pembuatan tagihan
      const recordPayload: RecordAndBillRequest = {
        customerId: Number(customer.id),
        currentReading: readingDataFromForm.currentReading,
        readingDate: readingDataFromForm.readingDate,
        notes: readingDataFromForm.notes,
        imageUrl: readingDataFromForm.photoUrl,
      };
      const result = await recordAndCreateBill(recordPayload);
      if (result.success) {
        setMeterReading({
          customerId: customer.id,
          previousReading: customer.lastReading ?? 0,
          currentReading: readingDataFromForm.currentReading,
          usage: readingDataFromForm.currentReading - (customer.lastReading ?? 0),
          billAmount: result.billAmount ?? 0,
          readingDate: readingDataFromForm.readingDate,
          notes: readingDataFromForm.notes,
          photos: [readingDataFromForm.photoUrl],
          readingId: result.readingId?.toString(),
          billId: result.billId?.toString(),
        });
        setBill({
          bill_id: result.billId?.toString() ?? '',
          amount: result.billAmount ?? 0,
          status: 'unpaid',
          total_due: result.billAmount ?? 0,
          dueDate: '',
        });
        setCurrentStep('payment');
      } else {
        setError(result.message || 'Gagal mencatat pembacaan meter.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal mencatat meter.');
    } finally {
      setIsUploading(false);
    }
  }, [customer, recordAndCreateBill, showToast]);

  // Handler for successful payment
  const handlePaymentSuccess = useCallback((paymentData: Payment) => {
    setPayment(paymentData);
    setCurrentStep('receipt');
    setShowSuccessNotification(true);
  }, [setCurrentStep, setPayment, setShowSuccessNotification]);

  // Payment cancellation (updated to use new hook)
  const handleCancelAndReset = useCallback(async () => {
    if (!meterReading?.billId) {
      showToast('error', 'Tidak ada data tagihan untuk dibatalkan.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin membatalkan pencatatan dan tagihan ini? Aksi ini tidak dapat diurungkan.')) {
      try {
        const result = await meterReadingAction.cancelReadingAndBill(meterReading.billId);
        if (result.success) {
          showToast('success', result.message || 'Transaksi berhasil dibatalkan.');
          handleResetWorkflow();
        } else {
          showToast('error', result.message || 'Gagal membatalkan transaksi.');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? (err as { message: string }).message 
          : 'Gagal membatalkan transaksi.';
        showToast('error', errorMessage);
      }
    }
  }, [meterReading, meterReadingAction, handleResetWorkflow, showToast]);

  // Effects
  useEffect(() => {
    setMounted(true);
    const timer = refreshTimerRef.current;
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (showSuccessNotification) {
      const timer = setTimeout(() => setShowSuccessNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl shadow-neumorph max-w-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full shadow-neumorph">
              <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800">Pembayaran Berhasil!</p>
              <p className="text-sm text-green-700">Pembayaran tagihan air untuk {customer?.name} telah berhasil diproses.</p>
            </div>
          </div>
        </div>
      )}

      {isOffline && (
        <div className="p-4 bg-amber-50 rounded-xl flex items-center gap-3 text-amber-700 border border-amber-200 shadow-neumorph">
          <div className="bg-amber-100 p-2 rounded-full">
            <WifiOff size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Mode Offline Aktif</p>
            <p className="text-xs">Data akan disimpan secara lokal dan disinkronkan saat terhubung kembali.</p>
          </div>
        </div>
      )}

      <div className="bg-[#e0e5ec] rounded-xl shadow-neumorph p-5 sm:p-6">
        <div className="flex justify-between mb-8 px-2">
          {['Pencarian', 'Tagihan', 'Pembayaran', 'Struk'].map((label, index) => {
            const isActive = index <= ['search', 'reading', 'payment', 'receipt'].indexOf(currentStep);
            const isCurrent = index === ['search', 'reading', 'payment', 'receipt'].indexOf(currentStep);

            return (
              <div key={label} className="flex flex-col items-center relative">
                <div className={`h-2.5 w-16 sm:w-24 rounded-full mb-3 transition-all duration-500 ${isActive ? 'bg-blue-600 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]' : 'bg-[#d1d9e6] shadow-inner'}`} />
                <span className={`text-xs sm:text-sm font-medium transition-all duration-500 ${isCurrent ? 'text-blue-600 scale-110' : isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                  {label}
                </span>
                {isCurrent && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-blue-600 rounded-full shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          {currentStep === 'search' && (
            <CustomerSearch
              onSearchById={handleCustomerSearchById}
              onSearchByName={handleCustomerSearchByName}
              loading={customerSearchLoading}
              error={error || customerSearchError}
              searchResults={searchResults}
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {currentStep === 'reading' && customer && (
            <MeterReadingForm
              customer={customer}
              onSubmit={handleMeterReadingSubmit}
              onBack={() => setCurrentStep('search')}
              isLoading={isUploading || meterReadingLoading}
              onCustomerUpdate={handleCustomerUpdate}
            />
          )}

          {currentStep === 'payment' && customer && bill && meterReading && (
            <PaymentForm
              bill={{
                ...bill,
                total_due: bill.total_due ?? 0,
                dueDate: bill.dueDate ?? '',
              }}
              customer={{
                ...customer,
                address: customer.address ?? '',
                saldo: customer.saldo ?? 0,
                hutang: customer.hutang ?? 0,
              }}
              meterReading={{
                ...meterReading,
                billId: meterReading.billId ?? '',
              }} // ✅ PASTIKAN PROPS INI DITERUSKAN
              onSuccess={handlePaymentSuccess}
              onPayLater={handlePayLater}
              onCancel={handleCancelAndReset}
            />
          )}

          {currentStep === 'receipt' && customer && meterReading && payment && (
            <TransactionReceipt
              customer={{
                ...customer,
                address: customer.address ?? '',
                saldo: customer.saldo ?? 0,
                hutang: customer.hutang ?? 0,
              }}
              meterReading={{
                ...meterReading,
                billId: meterReading.billId ?? '',
              }}
              payment={payment}
              onNext={handleResetWorkflow}
            />
          )}
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200">
          <div className="bg-blue-50/50 rounded-xl p-4 shadow-neumorph">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full shadow-neumorph flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-700 mb-1">Petunjuk Penggunaan</h5>
                <p className="text-sm text-gray-600">
                  Pastikan Anda berada di lokasi pelanggan saat melakukan pencatatan meter.
                  Foto meter wajib diambil dengan jelas dan menampilkan angka meter yang terbaca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}