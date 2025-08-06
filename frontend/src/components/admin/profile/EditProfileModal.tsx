"use client";

import { useForm } from 'react-hook-form';
import { User, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export type FormInputs = {
  full_name: string;
  username: string;
  phone_number: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profileInfo: FormInputs;
  onUpdate: (data: FormInputs) => Promise<{ success: boolean; message?: string }>;
}

export const EditProfileModal = ({ isOpen, onClose, profileInfo, onUpdate }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormInputs>({
    defaultValues: profileInfo,
  });

  useEffect(() => {
    reset(profileInfo);
  }, [profileInfo, reset]);

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 backdrop-blur-[6px] bg-black/20" onClick={onClose}></div>
      <div className="relative z-10 bg-[#e0e5ec] rounded-2xl p-6 w-full max-w-lg shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User /> Ubah Informasi Profil</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input {...register('full_name', { required: 'Nama lengkap wajib diisi' })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Username</label>
            <input {...register('username', { required: 'Username wajib diisi' })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
            <input {...register('phone_number', { required: 'Nomor telepon wajib diisi' })} className="w-full p-3 rounded-xl bg-[#d1d5dc] text-gray-800 shadow-[inset_2px_2px_5px_#bebebe,inset_-2px_-2px_5px_#ffffff] outline-none" />
            {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number.message}</p>}
          </div>
          <div className="flex justify-end pt-2 gap-2">
             <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-[#e0e5ec] text-gray-700 font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">Batal</button>
             <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed">{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};