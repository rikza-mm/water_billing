"use client";

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Definisikan tipe data yang akan dikirim ke API
interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  description: string;
  date: string;
  category: string;
  cashflow_classification: 'OPERATING' | 'INVESTING' | 'FINANCING';
  notes?: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Prop onSubmit sekarang menerima data yang lebih lengkap
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

// Definisikan struktur kategori untuk mempermudah pengelolaan
const expenseCategories = {
  OPERATING: [
    { value: 'ops_gaji_admin', label: 'Gaji Admin & Staf' },
    { value: 'ops_listrik_pompa', label: 'Listrik Pompa' },
    { value: 'ops_transportasi', label: 'Transportasi & BBM' },
    { value: 'ops_perawatan', label: 'Perawatan & Perbaikan' },
    { value: 'ops_atk', label: 'ATK & Kantor' },
    { value: 'ops_lain', label: 'Operasional Lainnya' },
  ],
  INVESTING: [
    { value: 'inv_beli_aset', label: 'Pembelian Aset Baru (Pompa, Pipa, dll)' },
    { value: 'inv_lain', label: 'Investasi Lainnya' },
  ],
  // FINANCING ditangani oleh ModalTab, jadi tidak perlu di sini
};

const incomeCategories = {
  OPERATING: [
    { value: 'pendapatan_penjualan', label: 'Pendapatan Penjualan Air' },
    { value: 'denda', label: 'Pendapatan Denda' },
    { value: 'pemasangan_baru', label: 'Biaya Pemasangan Baru' },
    { value: 'lainnya', label: 'Pendapatan Lainnya' },
  ],
  INVESTING: [
    { value: 'penjualan_aset', label: 'Hasil Penjualan Aset' },
  ],
};


export function AddTransactionModal({ isOpen, onClose, onSubmit }: AddTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [subType, setSubType] = useState<'OPERATING' | 'INVESTING'>('OPERATING');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: ''
  });
  const [displayAmount, setDisplayAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setSubType('OPERATING'); // Reset sub-tipe ke default saat tipe utama berubah
    setFormData({ ...formData, category: '' }); // Reset kategori
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData({ ...formData, amount: value });
    setDisplayAmount(value ? formatCurrency(parseInt(value)) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const finalData: TransactionFormData = {
        ...formData,
        type: type,
        cashflow_classification: subType, // Klasifikasi diambil dari state subType
      };
      
      // ✅ PERBAIKAN: Validasi data sebelum submit
      if (!finalData.amount || parseFloat(finalData.amount) <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }
      
      if (!finalData.description.trim()) {
        throw new Error('Deskripsi harus diisi');
      }
      
      if (!finalData.category) {
        throw new Error('Kategori harus dipilih');
      }
      
      if (!finalData.date) {
        throw new Error('Tanggal harus diisi');
      }
      
      // ✅ PERBAIKAN: Validasi tanggal tidak boleh di masa depan
      const selectedDate = new Date(finalData.date);
      const today = new Date();
      if (selectedDate > today) {
        throw new Error('Tanggal tidak boleh di masa depan');
      }
      
      // ✅ PERBAIKAN: Validasi kategori sesuai dengan tipe transaksi
      const availableCategories = type === 'income' ? incomeCategories : expenseCategories;
      const validCategories = availableCategories[subType] || [];
      const isValidCategory = validCategories.some(cat => cat.value === finalData.category);
      
      if (!isValidCategory) {
        throw new Error('Kategori tidak valid untuk tipe transaksi ini');
      }
      
      await onSubmit(finalData);
      toast.success('Transaksi berhasil ditambahkan!');
      
      // ✅ PERBAIKAN: Reset form setelah berhasil
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        notes: ''
      });
      setDisplayAmount('');
      setType('expense');
      setSubType('OPERATING');
      
      onClose(); // Tutup modal setelah berhasil
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan transaksi.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentCategories = type === 'expense' ? expenseCategories[subType] : incomeCategories[subType];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-sm bg-black/30" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Catat Transaksi Baru</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Pilih Jenis Transaksi */}
          <div className="flex gap-4">
            <button type="button" onClick={() => handleTypeChange('expense')} className={type === 'expense' ? 'button-neumorphic-primary active' : 'button-neumorphic-secondary'}>Pengeluaran</button>
            <button type="button" onClick={() => handleTypeChange('income')} className={type === 'income' ? 'button-neumorphic-primary active' : 'button-neumorphic-secondary'}>Pemasukan</button>
          </div>

          {/* 2. Pilih Sub-Tipe (Klasifikasi Arus Kas) */}
          <div>
            <label className="label-neumorphic">Jenis {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</label>
            <select value={subType} onChange={e => setSubType(e.target.value as 'OPERATING' | 'INVESTING')} className="input-neumorphic w-full">
              <option value="OPERATING">{type === 'expense' ? 'Biaya Operasional' : 'Pendapatan Operasional'}</option>
              <option value="INVESTING">{type === 'expense' ? 'Biaya Investasi' : 'Dari Aktivitas Investasi'}</option>
            </select>
          </div>

          {/* 3. Input Umum */}
          <div>
            <label className="label-neumorphic">Jumlah</label>
            <input type="text" value={displayAmount} onChange={handleAmountChange} placeholder="Rp 0" required className="input-neumorphic w-full" />
          </div>
          <div>
            <label className="label-neumorphic">Kategori</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="input-neumorphic w-full">
              <option value="">Pilih Kategori...</option>
              {currentCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-neumorphic">Tanggal</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="input-neumorphic w-full" />
          </div>
          <div>
            <label className="label-neumorphic">Keterangan</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="input-neumorphic w-full" rows={3}></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="button-neumorphic-primary">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}