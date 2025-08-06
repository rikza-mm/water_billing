'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user?.role) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/petugas/dashboard');
    }
  }, [router]);
}
