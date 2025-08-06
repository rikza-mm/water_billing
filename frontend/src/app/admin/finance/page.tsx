"use client";

import { useState } from 'react';
import {
  Calendar, RefreshCw, BarChart3, FileText,
  PieChart, DollarSign, Wallet, TrendingUp, Plus, Activity
} from "lucide-react";
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { useFinanceDashboard } from '@/hooks/admin/finance/useFinanceDashboard';
// Import pillar-based components
import { LabaRugiTab } from "@/components/admin/finance/tabs/LabaRugiTab";
import { ArusKasTab } from "@/components/admin/finance/tabs/ArusKasTab";
import { NeracaModalTab } from "@/components/admin/finance/tabs/NeracaModalTab";
import { BukuBesarTab } from "@/components/admin/finance/tabs/BukuBesarTab";
import { OverviewTab } from "@/components/admin/finance/tabs/OverviewTab";
// Import modal transaksi
import { AddTransactionModal } from '@/components/admin/finance/transactionsModal/AddTransactionModal';
import { ClosePeriodModal } from '@/components/admin/finance/transactionsModal/ClosePeriodModal';


export default function FinancePage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Awal tahun
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'laba_rugi' | 'arus_kas' | 'neraca_modal' | 'buku_besar'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);


  // Konsisten: gunakan hook useFinanceDashboard yang sudah diupdate
  const {
    dashboardData,
    incomeStatement,
    balanceSheet,
    cashFlowStatement,
    equityTransactions,
    recentFinancials,
    dailyOverview,
    customerBalances,
    validation,
    isLoading,
    error,
    lastUpdated,
    addTransaction,
    addEquityTransaction,
    closePeriod,
    fetchInitialData // gunakan fetchInitialData sebagai refresh
  } = useFinanceDashboard({
    dateRange,
    filterType: 'all',
    filterCategory: 'all',
    searchTerm: ''
  });

  // Handler untuk menambah transaksi
  const handleAddTransaction = async (data: {
    type: 'income' | 'expense';
    amount: string;
    description: string;
    date: string;
    category: string;
    cashflow_classification: 'OPERATING' | 'INVESTING' | 'FINANCING';
    notes?: string;
    asset_name?: string;
  }) => {
    try {
      const result = await addTransaction(data);
      if (result.success) {
        setIsAddModalOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      throw error;
    }
  };

  // Handler untuk tutup periode
  const handleClosePeriod = async (startDate: string, endDate: string) => {
    return await closePeriod(startDate, endDate);
  };



  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data keuangan...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchInitialData()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Transform customerBalances (CustomerSearchResult[]) to CustomerBalance[] for NeracaModalTab
  const mappedCustomerBalances = customerBalances.map(cust => ({
    customer_id: cust.customer_id,
    customer_name: cust.full_name,
    current_balance: cust.saldo || 0,
    current_debt: cust.hutang || 0,
    total_payments: 0, // default, update if available
    last_payment_date: '' // default, update if available
  }));

  return (
    <main className="p-6 space-y-6 overflow-y-auto bg-[#e0e5ec] min-h-screen">
      {/* Header */}
      <NeumorphicCard>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <TrendingUp className="inline mr-3" size={32} />
              Dasbor Keuangan
            </h1>
            <p className="text-gray-600">Dashboard analisis keuangan berdasarkan pilar akuntansi</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
              >
                <Plus size={18} />
                Tambah Transaksi
              </button>
              <button
                onClick={() => setIsClosePeriodModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
              >
                <Wallet size={18} />
                Tutup Periode
              </button>
              <button
                onClick={() => fetchInitialData()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
                disabled={isLoading}
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                Refresh Data
              </button>
            </div>
            {lastUpdated && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
              </div>
            )}
          </div>
        </div>
      </NeumorphicCard>

      {/* Tab Navigation */}
      <NeumorphicCard>
        <div className="flex flex-wrap gap-3">
          {[
            {
              key: 'overview',
              label: 'Overview',
              icon: <Activity size={18} />,
              description: 'Gambaran umum kondisi keuangan'
            },
            {
              key: 'laba_rugi',
              label: 'Laba Rugi (Income Statement)',
              icon: <BarChart3 size={18} />,
              description: 'Rincian pendapatan dan pengeluaran'
            },
            {
              key: 'arus_kas',
              label: 'Arus Kas (Cash Flow Statement)',
              icon: <DollarSign size={18} />,
              description: 'Pergerakan kas masuk dan keluar'
            },
            {
              key: 'neraca_modal',
              label: 'Neraca & Modal (Balance Sheet)',
              icon: <PieChart size={18} />,
              description: 'Posisi keuangan & perubahan modal'
            },
            {
              key: 'buku_besar',
              label: 'Buku Besar (Ledger)',
              icon: <Wallet size={18} />,
              description: 'Daftar lengkap semua transaksi'
            }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'overview' | 'laba_rugi' | 'arus_kas' | 'neraca_modal' | 'buku_besar')}
              className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                  : 'bg-[#e0e5ec] text-gray-700 hover:bg-gray-200 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] hover:shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff]'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                <span className="font-semibold text-sm">{tab.label}</span>
              </div>
              <span className={`text-xs ${activeTab === tab.key ? 'text-blue-100' : 'text-gray-500'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </NeumorphicCard>

      {/* Date Range Filter */}
      <NeumorphicCard>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter Tanggal (Date Range Picker):</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_3px_3px_7px_#bebebe,inset_-3px_-3px_7px_#ffffff] transition-all"
              />
              <span className="text-gray-500 font-medium">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#e0e5ec] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none focus:shadow-[inset_3px_3px_7px_#bebebe,inset_-3px_-3px_7px_#ffffff] transition-all"
              />
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange({
                start: new Date().toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateRange({
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setDateRange({
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
            >
              30 Hari Terakhir
            </button>
            <button
              onClick={() => setDateRange({
                start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition shadow-[2px_2px_5px_#bebebe,-2px_-2px_5px_#ffffff] hover:shadow-[1px_1px_3px_#bebebe,-1px_-1px_3px_#ffffff]"
            >
              Tahun Ini
            </button>
          </div>
        </div>
      </NeumorphicCard>

      {/* ✅ PERBAIKAN: Tab Content menggunakan data baru */}
      {/* Validation Alert */}
      {validation && validation.checks && (
        <NeumorphicCard>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Status Validasi Keuangan
            </h3>

            {/* Balance Sheet Validation */}
            <div className={`p-3 rounded-lg ${
              validation.checks.balance_sheet_equation.passed
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={validation.checks.balance_sheet_equation.passed ? '✅' : '❌'}>
                  {validation.checks.balance_sheet_equation.passed ? '✅' : '❌'}
                </span>
                <span className="font-medium">
                  Neraca: {validation.checks.balance_sheet_equation.status}
                </span>
                {!validation.checks.balance_sheet_equation.passed && (
                  <span className="text-red-600 text-sm">
                    (Selisih: Rp {validation.checks.balance_sheet_equation.difference?.toLocaleString('id-ID')})
                  </span>
                )}
              </div>
            </div>

            {/* Cash Calculation Validation */}
            <div className={`p-3 rounded-lg ${
              validation.checks.cash_calculation.passed
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                <span>{validation.checks.cash_calculation.passed ? '✅' : '⚠️'}</span>
                <span className="font-medium">
                  Perhitungan Kas: {validation.checks.cash_calculation.passed ? 'Konsisten' : 'Perlu Perhatian'}
                </span>
                {!validation.checks.cash_calculation.passed && (
                  <span className="text-yellow-600 text-sm">
                    (Selisih: Rp {validation.checks.cash_calculation.difference?.toLocaleString('id-ID')})
                  </span>
                )}
              </div>
            </div>
          </div>
        </NeumorphicCard>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && incomeStatement && cashFlowStatement && balanceSheet && (
        <OverviewTab
          incomeStatement={incomeStatement}
          cashFlowStatement={cashFlowStatement}
          balanceSheet={balanceSheet}
          dailyOverview={dailyOverview}
          recentFinancials={recentFinancials}
        />
      )}

   {activeTab === 'laba_rugi' && incomeStatement && (
  <LabaRugiTab 
    incomeStatement={incomeStatement} 
    recentFinancials={recentFinancials} // <-- Tambahkan prop ini
  />
)}

      {activeTab === 'arus_kas' && cashFlowStatement && (
        <ArusKasTab
          cashFlowStatement={cashFlowStatement}
          recentFinancials={recentFinancials}
        />
      )}

      {activeTab === 'neraca_modal' && balanceSheet && (
        <NeracaModalTab 
          balanceSheet={balanceSheet} 
          equityTransactions={equityTransactions}
          customers={mappedCustomerBalances}
          onAddEquityTransaction={addEquityTransaction}
        />
      )}

      {activeTab === 'buku_besar' && (
        <BukuBesarTab
          recentFinancials={recentFinancials}
          dateRange={dateRange}
        />
      )}

      {/* Loading State for Tab Content */}
      {!dashboardData && isLoading && (
        <NeumorphicCard>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data untuk tab {activeTab.replace('_', ' ')}...</p>
          </div>
        </NeumorphicCard>
      )}

      {/* No Data State */}
      {!dashboardData && !isLoading && !error && (
        <NeumorphicCard>
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">Tidak ada data keuangan tersedia</p>
            <p className="text-sm text-gray-500">Silakan periksa koneksi atau coba refresh data</p>
            <button
              onClick={() => fetchInitialData()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Coba Lagi
            </button>
          </div>
        </NeumorphicCard>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      {/* Close Period Modal */}
      <ClosePeriodModal
        isOpen={isClosePeriodModalOpen}
        onClose={() => setIsClosePeriodModalOpen(false)}
        dateRange={dateRange}
        onConfirm={handleClosePeriod}
      />

    </main>
  );
}