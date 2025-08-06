'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from '@/components/petugas/BottomNav';
import TopBar from '@/components/petugas/TopBar';
import { useAreaRestriction } from '@/hooks/useAreaRestriction';
import LoadingSpinner from '@/components/LoadingSpinner';
import TransitionWrapper from '@/components/TransitionWrapper';

export default function PetugasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isLoading, error, refreshAreaInfo } = useAreaRestriction();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/login');
        return;
      }
      const userData = JSON.parse(user);
      if (userData.role !== 'petugas') {
        router.push('/login');
        return;
      }

      // Panggil API untuk mendapatkan data area
      await refreshAreaInfo();
      setIsCheckingSession(false);
    };
    
    initializeSession();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    handleResize();

    // Simpan path terakhir setiap kali halaman berubah
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastPage', pathname);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [router, refreshAreaInfo, pathname]);
  
  if (isCheckingSession || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#e0e5ec]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 font-medium">
          {error ? 'Gagal memuat sesi' : 'Memverifikasi sesi Anda...'}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#e0e5ec]">
      <TopBar />
      <main className={`
        flex-1 overflow-y-auto 
        ${isMobile ? 'pb-24 pt-20' : 'pb-20 pt-20'} 
      `}>
        <TransitionWrapper>
          <div className={`
            flex-1 flex flex-col
            mx-auto px-4 py-4 sm:py-6 
            ${isMobile ? 'w-full' : 'container'}
          `}>
            {children}
          </div>
        </TransitionWrapper>
      </main>
      <BottomNav />
    </div>
  );
} 
