"use client";

import { NeumorphicCard } from '@/components/NeumorphicCard';
import { ProfileInfo } from '@/hooks/admin/profile/useAdminProfile';
import { User } from 'lucide-react';

interface Props {
  profileInfo: ProfileInfo;
}

export const ProfileDetailCard = ({ profileInfo }: Props) => {
  return (
    <NeumorphicCard>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User /> Informasi Profil
        </h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Nama Lengkap</span>
          <span className="font-semibold text-gray-800">{profileInfo.full_name}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Username</span>
          <span className="font-semibold text-gray-800">{profileInfo.username}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Nomor Telepon</span>
          <span className="font-semibold text-gray-800">{profileInfo.phone_number}</span>
        </div>
      </div>
    </NeumorphicCard>
  );
};