'use client';

import type React from "react";
import { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Users,
  UserCog,
  BarChart2,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

type Props = {
  user?: {
    full_name: string;
    role: string;
  } | null;
  isCollapsed: boolean;
  onToggle: () => void;
};

type SubMenuItem = {
  name: string;
  icon: React.ReactNode;
  key: string;
  path: string;
};

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  key: string;
  path: string;
  submenu?: SubMenuItem[];
};

export default function Sidebar({ user, isCollapsed, onToggle }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = useMemo(() => [
    { name: 'Dashboard', icon: <Home size={18} />, key: 'dashboard', path: '/admin/dashboard' },
    {
      name: 'Pelanggan',
      icon: <Users size={18} />,
      key: 'pelanggan',
      path: '/admin/customer',
      submenu: [
        {
          name: 'Data Pelanggan',
          icon: <Users size={16} />,
          key: 'data-pelanggan',
          path: '/admin/customer'
        },
        {
          name: 'Riwayat Pelanggan',
          icon: <Receipt size={16} />,
          key: 'riwayat-pelanggan',
          path: '/admin/riwayat-pelanggan'
        }
      ]
    },
    { name: 'Area', icon: <MapPin size={18} />, key: 'area', path: '/admin/area' },
    { name: 'Petugas', icon: <UserCog size={18} />, key: 'manage-Petugas', path: '/admin/manage-petugas' },
    { name: 'Penempatan Area', icon: <UserCheck size={18} />, key: 'penempatan-area', path: '/admin/penempatan-area' },
    { name: 'Finance', icon: <TrendingUp size={18} />, key: 'finance', path: '/admin/finance' },
    { name: 'Analyst', icon: <BarChart2 size={18} />, key: 'keuangan', path: '/admin/analyst' },
   
  ], []);

  // Cek apakah path saat ini ada di submenu, jika ya, buka submenu tersebut
  useEffect(() => {
    let foundSubmenu = false;

    // Cek apakah pathname ada di submenu
    menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubItem = item.submenu.some(subItem =>
          pathname === subItem.path || pathname.startsWith(`${subItem.path}/`)
        );

        if (hasActiveSubItem) {
          setExpandedMenu(item.key);
          foundSubmenu = true;
        }
      }
    });

    // Jika tidak ada di submenu, cek apakah pathname cocok dengan item utama
    if (!foundSubmenu) {
      menuItems.forEach(item => {
        if (pathname === item.path) {
          // Jika item utama tidak memiliki submenu, tutup semua submenu
          if (!item.submenu) {
            setExpandedMenu(null);
          }
        }
      });
    }
  }, [pathname, menuItems]);

  const toggleSubmenu = (key: string) => {

    // Selalu navigasi ke halaman utama menu terlebih dahulu
    const mainItem = menuItems.find(item => item.key === key);
    if (mainItem) {
      try {
        router.push(mainItem.path);
      } catch {
        // Fallback untuk navigasi jika router.push gagal
        window.location.href = mainItem.path;
      }
    }

    // Jika sidebar tidak collapsed, toggle submenu
    if (!isCollapsed) {
      setExpandedMenu(prev => {
        const newValue = prev === key ? null : key;
        return newValue;
      });
    }
  };


  const handleClick = (path: string) => {
    try {
      router.push(path);
    } catch {
      // Fallback untuk navigasi jika router.push gagal
      window.location.href = path;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    try {
      router.push('/login');
    } catch {
      // Fallback untuk navigasi jika router.push gagal
      window.location.href = '/login';
    }
  };

  const isActive = (path: string) => {
    // Jika path adalah root path seperti /admin/dashboard, maka hanya cocok jika pathname persis sama
    if (path.split('/').length <= 3) {
      return pathname === path;
    }
    // Untuk path yang lebih dalam, cocok jika pathname dimulai dengan path
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const hasActiveSubmenu = (item: MenuItem): boolean => {
    if (!item.submenu) return false;
    return item.submenu.some((subItem: SubMenuItem) => isActive(subItem.path));
  };

  return (
    <aside
      className={`
        h-screen bg-[#e0e5ec] flex flex-col justify-between p-6 overflow-y-auto text-orange-600
        transition-all duration-300 ease-in-out relative
        ${isCollapsed ? 'w-25' : 'w-72'}
      `}
    >
      <div>
        {/* Logo dan Profil */}
        <div className={`flex flex-col items-center ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
          <div className="rounded-full p-1 shadow-[8px_8px_12px_#bebebe,-8px_-8px_12px_#ffffff]">
            <Image
              src="/profile.png"
              alt="profile"
              width={isCollapsed ? 40 : 90}
              height={isCollapsed ? 40 : 90}
              className="rounded-full"
              priority
              style={{ height: 'auto', width: 'auto' }}
            />
          </div>
          {!isCollapsed && (
            <div className="mt-4 text-center px-6 py-3 rounded-xl shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                {user?.full_name || 'Admin User'}
              </h2>
              <p className="text-sm text-gray-600">
                {user?.role || 'System Administrator'}
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
    onClick={onToggle}
    className={`
      absolute top-2 right-2
      flex items-center justify-center
      p-2 rounded-xl transition-all duration-300
      shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
      hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
      ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}
    `}
  >
    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
  </button>

        {/* Menu Navigation */}
        <nav className="mt-6 space-y-3">
          {menuItems.map((item) => (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if ('submenu' in item) {
                    toggleSubmenu(item.key);
                  } else {
                    handleClick(item.path);
                  }
                }}
                className={`
                  w-full flex items-center
                  ${isCollapsed ? 'justify-center px-2' : 'justify-start px-5'}
                  py-3.5 rounded-xl transition-all duration-300 text-gray-700
                  ${(isActive(item.path) || hasActiveSubmenu(item))
                    ? 'shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] font-medium'
                    : 'shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <div className={`
                  ${isCollapsed ? 'p-1' : 'p-2'}
                  rounded-lg flex items-center justify-center
                  ${(isActive(item.path) || hasActiveSubmenu(item)) ? 'text-blue-600' : 'text-gray-600'}
                `}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className={`
                      text-sm ml-3
                      ${(isActive(item.path) || hasActiveSubmenu(item)) ? 'text-blue-600' : 'text-gray-600'}
                    `}>
                      {item.name}
                    </span>
                    {'submenu' in item && (
                      <span className="text-gray-500">
                        {expandedMenu === item.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Submenu */}
              {'submenu' in item && !isCollapsed && expandedMenu === item.key && (
                <div className="ml-8 pl-4 border-l border-gray-200 space-y-1">
                  {item.submenu?.map((subItem) => (
                    <button
                      key={subItem.key}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClick(subItem.path);
                      }}
                      className={`                        w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-300
                        ${isActive(subItem.path)
                          ? 'shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] font-medium'
                          : 'hover:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]'
                        }
                      `}
                    >
                      <div className={`
                        p-1 rounded-lg flex items-center justify-center
                        ${isActive(subItem.path) ? 'text-blue-600' : 'text-gray-500'}
                      `}>
                        {subItem.icon}
                      </div>
                      <span className={`
                        text-xs ml-2
                        ${isActive(subItem.path) ? 'text-blue-600' : 'text-gray-500'}
                      `}>
                        {subItem.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLogout();
        }}
        className={`
          mt-6 flex items-center
          ${isCollapsed ? 'justify-center px-2' : 'justify-start px-5'}
          py-3.5 rounded-xl transition-all duration-300
          text-red-500 hover:text-red-600
          shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
          hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
          w-full
        `}
        title={isCollapsed ? 'Logout' : undefined}
      >
        <div className={`${isCollapsed ? 'p-1' : 'p-2'} rounded-lg flex items-center justify-center`}>
          <LogOut size={18} />
        </div>
        {!isCollapsed && <span className="text-sm font-medium ml-3">Logout</span>}
      </button>
    </aside>
  );
}

