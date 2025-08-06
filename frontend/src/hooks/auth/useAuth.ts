'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });

  const handleLogin = async (username: string, password: string, role: 'admin' | 'petugas') => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: 'include' // Untuk menangani cookies jika ada
      });

      const result = await response.json();

      if (response.ok) {
        // Validasi role setelah login berhasil
        if (result.user.role !== role) {
          setMessage(`Akun ini tidak memiliki akses sebagai ${role}`);
          return;
        }

        setToken(result.token);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        router.push(result.user.role === 'admin' ? '/admin/dashboard' : '/petugas/dashboard');
      } else {
        setMessage(result.message || 'Login gagal');
      }
    } catch {
      setMessage('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return {
    handleLogin,
    handleLogout,
    loading,
    message,
    token
  };
};
