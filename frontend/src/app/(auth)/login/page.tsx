'use client';

import React from 'react';
import { useAuthRedirect } from '@/utils/authRedirect';
import { LoginForm } from '@/components/login/LoginForm';

export default function LoginPage() {
  useAuthRedirect();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec] text-gray-800">
      <LoginForm />
    </div>
  );
}
