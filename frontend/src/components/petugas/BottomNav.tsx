'use client';

import { Home, Users, GaugeCircle, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/petugas/dashboard' && pathname === '/petugas') {
      return true;
    }
    return pathname === path;
  };

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/petugas/dashboard',
      badge: null
    },
    { 
      icon: Users, 
      label: 'Customer', 
      path: '/petugas/customers',
      badge: null
    },
    { 
      icon: GaugeCircle, 
      label: '', 
      path: '/petugas/meter-reading',
      badge: null,
      isSpecial: true
    },
    { 
      icon: History, 
      label: 'Riwayat', 
      path: '/petugas/history',
      badge: null
    },
    { 
      icon: Settings, 
      label: 'Pengaturan', 
      path: '/petugas/profile',
      badge: null
    },
  ];

  return (
    <div className="fixed bottom-0 w-full z-50">
      {/* Apple Liquid Glass container - konsisten dengan TopBar */}
      <div className="relative mx-2 mb-2">
        <div className="absolute inset-0 bg-white/8 backdrop-blur-2xl rounded-2xl border border-white/12 shadow-2xl" />
        
        {/* Navigation content */}
        <div className="relative">
          <div className="flex items-center justify-between px-3 h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isSpecial) {
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="relative -mt-8"
                  >
                    <div className={`
                      flex flex-col items-center justify-center
                      w-15 h-15 rounded-full
                      ${active 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_8px_25px_rgba(59,130,246,0.4)]' 
                        : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-[0_4px_15px_rgba(107,114,128,0.3)]'}
                      transition-all duration-300
                      hover:shadow-[0_10px_30px_rgba(59,130,246,0.5)]
                      hover:scale-105
                    `}>
                      <Icon className="w-7 h-7 text-white mb-0.5" strokeWidth={2} />
                      <span className="text-[10px] text-white font-medium">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    relative flex flex-col items-center
                    min-w-[4rem] px-2
                    transition-all duration-300
                    group
                  `}
                >
                  <div className={`
                    flex flex-col items-center
                    transition-all duration-300 ease-in-out
                    ${active ? 'transform -translate-y-1' : ''}
                  `}>
                    <Icon className={`
                      w-5 h-5
                      ${active 
                        ? 'text-blue-600' 
                        : 'text-gray-500 group-hover:text-gray-700'}
                      transition-all duration-300
                    `} />
                    <span className={`
                      text-[10px] mt-1
                      ${active 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-500 group-hover:text-gray-700'}
                      transition-all duration-300
                    `}>
                      {item.label}
                    </span>
                  </div>
                  
                  {active && (
                    <span className="
                      absolute -top-1 left-1/2 -translate-x-1/2
                      w-1 h-1 rounded-full
                      bg-blue-600
                    "/>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
