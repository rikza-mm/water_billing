'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/admin/dashboard/Topbar';
import Sidebar from '@/components/admin/dashboard/Sidebar';
import TransitionWrapper from '@/components/TransitionWrapper';

interface User {
  full_name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(userData);
  }, [router]);

  const handleToggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-[#e0e5ec]">
      <Sidebar 
        user={user}
        isCollapsed={isCollapsed}
        onToggle={handleToggleSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <TransitionWrapper>
            <div className="p-6">
              {children}
            </div>
          </TransitionWrapper>
        </main>
      </div>
    </div>
  );
}
