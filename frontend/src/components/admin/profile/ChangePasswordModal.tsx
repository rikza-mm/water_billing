"use client";

import { useForm } from 'react-hook-form';
import { Lock, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export type PasswordInputs = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (data: PasswordInputs) => Promise<{ success: boolean; message?: string }>;
}

export const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm<PasswordInputs>();
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data: PasswordInputs) => {
    await onChangePassword(data);
    reset();
  };

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Lock /> Ubah Password</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Password Lama</label>
            <input type="password" {...register('oldPassword', { required: 'Password lama wajib diisi' })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {typeof errors.oldPassword?.message === 'string' && <p className="text-xs text-red-500 mt-1">{errors.oldPassword.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Password Baru</label>
            <input type="password" {...register('newPassword', { required: 'Password baru wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {typeof errors.newPassword?.message === 'string' && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
            <input type="password" {...register('confirmPassword', { required: 'Konfirmasi wajib diisi', validate: value => value === newPassword || 'Password tidak cocok' })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {typeof errors.confirmPassword?.message === 'string' && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div className="flex justify-end pt-2 gap-2">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed">{isSubmitting ? 'Menyimpan...' : 'Ubah Password'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};