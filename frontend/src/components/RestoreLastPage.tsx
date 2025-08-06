'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RestoreLastPage() {
  const router = useRouter();

  useEffect(() => {
    // Hanya redirect jika user sudah login dan di halaman root
    const user = localStorage.getItem('user');
    const lastPage = localStorage.getItem('lastPage');
    if (user && lastPage && window.location.pathname === '/') {
      router.replace(lastPage);
    }
  }, [router]);

  return null;
}