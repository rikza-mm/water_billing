'use client';

import { useSettings } from '@/hooks/petugas/profile/useSettings';
import { User } from 'lucide-react';

export default function TopBar() {
  const { profile, loading } = useSettings();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="relative mx-2 mt-2">
        {/* Glass morphism background - konsisten dengan BottomNav */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20" />
        
        {/* Content */}
        <div className="relative px-3 py-3 flex justify-between items-center h-16">
          {/* Left: Profile Section */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              {profile?.full_name ? (
                <span className="text-sm font-bold text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            
            {/* Officer Name */}
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                {loading ? 'Loading...' : profile?.full_name || 'Petugas'}
              </p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                {profile?.role === 'petugas' ? 'Petugas Lapangan' : profile?.role || 'Staff'}
              </p>
            </div>
          </div>

          {/* Right: Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm animate-pulse" />
            <span className="text-xs text-gray-600 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
