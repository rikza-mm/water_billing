"use client";

import StatCards from "@/components/admin/dashboard/dashboardStats/StatCards";
import IncomeExpenseChart from "@/components/admin/dashboard/dashboardStats/IncomeExpenseChart";
import CustomerStatusPie from "@/components/admin/dashboard/dashboardStats/CustomerStatusPie";
import { OverdueCustomers } from "@/components/admin/dashboard/dashboardStats/OverdueCustomers";
import LatestNotifications from "@/components/admin/dashboard/dashboardStats/LatestNotifications";
import { useAdminDashboard } from "@/hooks/admin/dashboard/useAdminDashboard";
import StatistikPelangganPerWilayah from "@/components/admin/dashboard/dashboardStats/StatistikPelangganPerWilayah";
import RingkasanAktivitasPetugas from "@/components/admin/dashboard/dashboardStats/RingkasanAktivitasPetugas";

export default function DashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 text-lg">{error || "Gagal memuat data dasbor."}</p>
      </div>
    );
  }

  const { summary, incomeExpenseTrend, overdueCustomers, notifications, customersByArea, officerActivity } = data;

  const transformedCustomers = overdueCustomers.map(customer => ({
    name: customer.name,
    amount: Number(customer.amount),
    phone_number: customer.phone_number || "-"
  }));

  // Pastikan nilai default untuk summary agar tidak error pada komponen
  const safeSummary = {
    ...summary,
    incomeToday: summary.incomeToday ?? 0,
    incomeThisWeek: summary.incomeThisWeek ?? 0,
  };

  return (
    <div className="space-y-6">
      <StatCards summary={safeSummary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseChart trendData={incomeExpenseTrend} />
        <CustomerStatusPie summary={{ activeCustomers: summary.activeCustomers, inactiveCustomers: summary.inactiveCustomers }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverdueCustomers customers={transformedCustomers} />
        <LatestNotifications notifications={notifications} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <StatistikPelangganPerWilayah data={customersByArea} />
        <RingkasanAktivitasPetugas activity={officerActivity} />
      </div>
    </div>
  );
}
