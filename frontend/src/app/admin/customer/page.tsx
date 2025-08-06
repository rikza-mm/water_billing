"use client";

import { CustomerDetail, useAdminCustomers, Customer, CustomerUpdateData } from "@/hooks/admin/customer/useAdminCustomers";
import { CustomerStats } from "@/components/admin/customer/CustomerStats";
import CustomerTable from "@/components/admin/customer/CustomerTable";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { CustomerDetailModal } from "@/components/admin/customer/CustomerDetailModal";
import { CustomerEditModal } from "@/components/admin/customer/CustomerEditModal";
import { useState } from "react";
import { AddCustomerModal } from '@/components/admin/customer/AddCustomerModal';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Users, RefreshCw } from 'lucide-react';
import { TransitionCustomerModal } from '@/components/admin/customer/TransitionCustomerModal';
import { useTransitionCustomer } from '@/hooks/admin/customer/useTransitionCustomer';
import type { TransitionCustomerPayload } from '@/hooks/admin/customer/useTransitionCustomer';

export default function CustomerManagementPage() {
  const {
    customers,
    pagination,
    summaryStats,
    loading,
    error,
    filters,
    setFilter,
    areas,
    loadingAreas,
    categories,
    loadingCategories,
    fetchCustomerDetail,
    updateCustomer,
    goToPage,
    createCustomer,
    refreshData,
    updateCustomerStatus
  } = useAdminCustomers();

  const { migrateCustomer } = useTransitionCustomer();

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);

  const handleDetailClick = async (customer: Customer) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const detail = await fetchCustomerDetail(customer.id);
      setDetailCustomer(detail);
    } catch {
      toast.error('Gagal mengambil detail pelanggan.');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditClick = async (customer: Customer) => {
    setDetailLoading(true);
    setEditOpen(true);
    try {
      const detail = await fetchCustomerDetail(customer.id);
      setEditCustomer(detail.profile);
    } catch {
      toast.error('Gagal mengambil data untuk diedit.');
      setEditOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateSubmit = async (id: number, data: CustomerUpdateData) => {
    const toastId = toast.loading('Memperbarui data...');
    try {
      const payload: CustomerUpdateData = {
        full_name: data.full_name,
        phone_number: data.phone_number,
        address: data.address,
        category_id: data.category_id,
        area_id: data.area_id,
        meter_number: data.meter_number,
      };
      await updateCustomer(id, payload);
      toast.success('Data pelanggan berhasil diperbarui.', { id: toastId });
      setEditOpen(false);
      refreshData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui data.', { id: toastId });
    }
  };

  const handleStatusChangeTable = async (customer: Customer) => {
    const toastId = toast.loading('Memperbarui status pelanggan...');
    try {
      let newStatus: 'active' | 'inactive' | 'suspended';
      if (customer.status === 'active') {
        newStatus = 'inactive';
      } else {
        newStatus = 'active';
      }
      await updateCustomerStatus(customer.id, newStatus);
      toast.success('Status pelanggan berhasil diperbarui.', { id: toastId });
      refreshData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status pelanggan.', { id: toastId });
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setEditOpen(false);
    setDetailCustomer(null);
    setEditCustomer(null);
  };

  const handleAddCustomer = async (data: CustomerUpdateData) => {
    const safeData = {
      ...data,
      full_name: data.full_name ?? "",
      area_id: data.area_id ?? "",
      category_id: data.category_id ?? "",
      phoneNumber: data.phone_number ?? "",
      address: data.address ?? "",
      meter_number: data.meter_number ?? "",
    };
    await createCustomer(safeData);
  };

  const handleRefresh = () => {
    refreshData();
    toast.success('Data berhasil diperbarui');
  };

  const handleTransitionSubmit = async (formData: TransitionCustomerPayload) => {
    const toastId = toast.loading('Memigrasikan data pelanggan...');
    try {
      const result = await migrateCustomer(formData);
      if (result.success) {
        toast.success('Pelanggan berhasil dimigrasikan!', { id: toastId });
        setTransitionOpen(false);
        refreshData();
      } else {
        toast.error(result.message || 'Gagal memigrasikan pelanggan.', { id: toastId });
      }
    } catch (error) {
      toast.error((error instanceof Error ? error.message : 'Terjadi kesalahan.'), { id: toastId });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-6">
        <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#e0e5ec] p-6 space-y-6">
      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Pelanggan</h1>
              <p className="text-gray-600">Kelola data pelanggan air bersih</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-semibold shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] hover:bg-blue-100 transition-all duration-200 flex items-center gap-2"
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] hover:bg-green-600 transition-all duration-200 flex items-center gap-2"
              onClick={() => setTransitionOpen(true)}
            >
              <Plus size={20} />
              Migrasi Pelanggan Lama
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={20} />
              Tambah Pelanggan
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CustomerStats stats={summaryStats} />
      </div>

      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#e0e5ec] p-2 rounded-lg shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Filter & Pencarian</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-2">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, ID, atau alamat..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#d1d5dc] text-gray-800 placeholder-gray-500 border-none outline-none shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-[#d1d5dc] text-gray-800 border-none outline-none shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]"
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Wilayah</label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-[#d1d5dc] text-gray-800 border-none outline-none shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]"
              value={filters.area}
              onChange={e => setFilter('area', e.target.value)}
              disabled={loadingAreas}
            >
              <option value="all">Semua Wilayah</option>
              {areas && areas.map(area => (
                <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Kategori</label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-[#d1d5dc] text-gray-800 border-none outline-none shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]"
              value={filters.category}
              onChange={e => setFilter('category', e.target.value)}
              disabled={loadingCategories}
            >
              <option value="all">Semua Kategori</option>
              {categories && categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tunggakan</label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-[#d1d5dc] text-gray-800 border-none outline-none shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff]"
              value={filters.arrears}
              onChange={e => setFilter('arrears', e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="none">Tidak Ada</option>
              <option value="1_month">1 Bulan</option>
              <option value="2_months_plus">2 Bulan atau Lebih</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#e0e5ec] shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] rounded-2xl p-6">
        {loading && customers.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <CustomerTable 
            customers={customers} 
            loading={loading} 
            onDetail={handleDetailClick}
            onEdit={handleEditClick}
            onStatusChange={handleStatusChangeTable}
            currentPage={pagination?.page || 1}
            perPage={pagination?.perPage || 10}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-gray-700">
              Halaman <span className="font-semibold text-blue-700">{pagination.page}</span> dari{' '}
              <span className="font-semibold text-blue-700">{pagination.totalPages}</span>{' '}
              (<span className="font-semibold text-blue-700">{pagination.total}</span> pelanggan)
            </div>
            
            <div className="flex gap-2 bg-[#e0e5ec] rounded-xl shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] p-2">
              <button
                className="px-4 py-2 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_6px_#bebebe,-2px_-2px_6px_#ffffff] text-gray-700 font-semibold disabled:opacity-50 hover:bg-blue-100 transition-all duration-200"
                onClick={() => goToPage(1)}
                disabled={pagination.page === 1}
              >
                &laquo; Awal
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_6px_#bebebe,-2px_-2px_6px_#ffffff] text-gray-700 font-semibold disabled:opacity-50 hover:bg-blue-100 transition-all duration-200"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                &lsaquo; Prev
              </button>
              <span className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold shadow-[2px_2px_6px_#bebebe,-2px_-2px_6px_#ffffff]">
                {pagination.page}
              </span>
              <button
                className="px-4 py-2 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_6px_#bebebe,-2px_-2px_6px_#ffffff] text-gray-700 font-semibold disabled:opacity-50 hover:bg-blue-100 transition-all duration-200"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next &rsaquo;
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_6px_#bebebe,-2px_-2px_6px_#ffffff] text-gray-700 font-semibold disabled:opacity-50 hover:bg-blue-100 transition-all duration-200"
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
              >
                Akhir &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
      
      <CustomerDetailModal 
        open={detailOpen} 
        onClose={handleCloseDetail} 
        customerDetail={detailCustomer}
        loading={detailLoading}
      />

      <CustomerEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customerDetail={editCustomer}
        onEdit={handleUpdateSubmit}
        areas={areas || []}
        categories={categories || []}
      />

      <TransitionCustomerModal
        isOpen={transitionOpen}
        onClose={() => setTransitionOpen(false)}
        onSubmit={handleTransitionSubmit}
        areas={areas || []}
        categories={categories || []}
      />

      <AddCustomerModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddCustomer}
        areas={areas || []}
        categories={categories || []}
      />
    </main>
  );
}