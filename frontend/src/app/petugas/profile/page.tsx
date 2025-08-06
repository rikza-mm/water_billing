'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, LogOut } from 'lucide-react';
import ProfileCard from '@/components/petugas/profile/ProfileCard';
import { useSettings } from '@/hooks/petugas/profile/useSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { loading, profile } = useSettings();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
    router.refresh();
  };

  const confirmLogout = () => {
    if (window.confirm('Anda yakin ingin keluar?')) {
      handleLogout();
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div>
        <ProfileCard profile={profile} loading={loading} />
      </div>

      {/* Logout Section */}
      <div className="bg-[#e0e5ec] rounded-xl p-4
        shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-medium text-gray-800"></h3>
        </div>
        <button
          onClick={confirmLogout}
          className="w-full p-3 rounded-lg
            bg-red-500 hover:bg-red-600
            text-white font-medium
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
            active:shadow-[inset_2px_2px_4px_#be2727,inset_-2px_-2px_4px_#ff3c3c]
            transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
