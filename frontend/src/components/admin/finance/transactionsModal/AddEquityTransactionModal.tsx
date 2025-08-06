import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Landmark, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Tipe data untuk form
type EquityTransactionInputs = {
  type: 'SETORAN_MODAL' | 'PRIVE';
  amount: string;
  description: string;
  transaction_date: string;
};

// Props untuk komponen modal
interface AddEquityTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EquityTransactionInputs) => Promise<void>;
}

export function AddEquityTransactionModal({ isOpen, onClose, onSubmit }: AddEquityTransactionModalProps) {
  const [formData, setFormData] = useState<EquityTransactionInputs>({
    type: 'SETORAN_MODAL',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [displayAmount, setDisplayAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        type: 'SETORAN_MODAL',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setDisplayAmount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData({ ...formData, amount: value });
    setDisplayAmount(value ? formatCurrency(parseInt(value)) : '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Validasi data
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }
      
      if (!formData.description.trim()) {
        throw new Error('Keterangan harus diisi');
      }
      
      const selectedDate = new Date(formData.transaction_date);
      const today = new Date();
      if (selectedDate > today) {
        throw new Error('Tanggal tidak boleh di masa depan');
      }
      
      await onSubmit(formData);
      toast.success('Transaksi modal berhasil ditambahkan!');
      
      // Reset form
      setFormData({
        type: 'SETORAN_MODAL',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setDisplayAmount('');
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan transaksi modal.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-sm bg-black/30" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Landmark size={24} className="text-purple-600" />
            Tambah Transaksi Modal
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Tipe Transaksi */}
          <div>
            <label className="label-neumorphic">Tipe Transaksi</label>
            <select 
              value={formData.type} 
              onChange={(e) => setFormData({...formData, type: e.target.value as 'SETORAN_MODAL' | 'PRIVE'})} 
              className="input-neumorphic w-full"
            >
              <option value="SETORAN_MODAL">Setoran Modal</option>
              <option value="PRIVE">Prive (Penarikan Pribadi)</option>
            </select>
          </div>

          {/* Jumlah */}
          <div>
            <label className="label-neumorphic">Jumlah</label>
            <input 
              type="text" 
              value={displayAmount} 
              onChange={handleAmountChange} 
              placeholder="Rp 0" 
              required 
              className="input-neumorphic w-full" 
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="label-neumorphic">Tanggal</label>
            <input 
              type="date" 
              value={formData.transaction_date}
              onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
              required
              className="input-neumorphic w-full" 
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="label-neumorphic">Keterangan</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={formData.type === 'SETORAN_MODAL' ? "Cth: Setoran tambahan untuk ekspansi" : "Cth: Penarikan pribadi bulan Agustus"} 
              required
              className="input-neumorphic w-full" 
              rows={3}
            ></textarea>
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