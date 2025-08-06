"use client";

import { useState } from 'react';
import { useAdminProfile } from '@/hooks/admin/profile/useAdminProfile';
import { AlertTriangle, UserCircle } from 'lucide-react';
import { NeumorphicCard } from '@/components/NeumorphicCard';
import { ProfileDetailCard } from '@/components/admin/profile/ProfileDetailCard';
import { EditProfileModal } from '@/components/admin/profile/EditProfileModal';
import { ChangePasswordModal } from '@/components/admin/profile/ChangePasswordModal';
import { ActivitySummaryCard } from '@/components/admin/profile/ActivitySummaryCard';
import { ActivityLogTable } from '@/components/admin/profile/ActivityLogTable';
import { AdminSettingsModal } from '@/components/admin/profile/AdminSettingsForm';
import type { FormInputs } from '@/components/admin/profile/EditProfileModal';
import type { PasswordInputs } from '@/components/admin/profile/ChangePasswordModal';

export default function AdminProfilePage() {
  const { data, isLoading, error, updateProfile, changePassword } = useAdminProfile();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center p-8">Memuat profil admin...</div>;
  }

  if (error || !data) {
    return (
      <NeumorphicCard>
        <div className="text-center py-8 text-red-600 flex flex-col items-center gap-2">
          <AlertTriangle size={32} />
          <p className="font-semibold">Gagal Memuat Data Profil</p>
          <p className="text-sm">{error || "Data tidak ditemukan."}</p>
        </div>
      </NeumorphicCard>
    );
  }

  const { profileInfo, activitySummary, activityLog } = data;

  const handleUpdateProfile = async (formData: FormInputs) => {
    const result = await updateProfile(formData);
    setIsEditProfileOpen(false);
    return result;
  };

  const handleChangePassword = async (formData: PasswordInputs) => {
    const result = await changePassword(formData);
    setIsChangePasswordOpen(false);
    return result;
  };

  return (
    <main className="p-6 space-y-6 bg-[#e0e5ec]">
      <NeumorphicCard>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <UserCircle /> Profil Admin
            </h1>
            <p className="text-gray-600">Kelola informasi akun dan lihat riwayat aktivitas Anda.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="button-neumorphic px-4 py-2 text-sm font-medium"
              onClick={() => setIsEditProfileOpen(true)}
            >Edit Profil</button>
            <button
              className="button-neumorphic px-4 py-2 text-sm font-medium"
              onClick={() => setIsChangePasswordOpen(true)}
            >Ubah Password</button>
            <button
              className="button-neumorphic px-4 py-2 text-sm font-medium"
              onClick={() => setIsSettingsOpen(true)}
            >Setting Sistem</button>
          </div>
        </div>
      </NeumorphicCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Tampilan Profil & Ringkasan Aktivitas */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileDetailCard 
            profileInfo={profileInfo} 
          />
          <ActivitySummaryCard summary={activitySummary} />
        </div>

        {/* Kolom Kanan: Log Aktivitas & Pengaturan Admin */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityLogTable logs={activityLog} />
        </div>
      </div>

      {/* Modal-modal yang tersembunyi */}
      {isEditProfileOpen && (
        <EditProfileModal 
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profileInfo={profileInfo}
          onUpdate={handleUpdateProfile}
        />
      )}
      {isChangePasswordOpen && (
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          onChangePassword={handleChangePassword}
        />
      )}
      {isSettingsOpen && (
        <AdminSettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}