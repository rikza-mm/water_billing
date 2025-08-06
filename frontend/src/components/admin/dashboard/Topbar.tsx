"use client";

import { Bell, Search, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";


export default function Topbar() {
  const router = useRouter();
  return (
    <>
      <header className="w-full h-16 px-6 flex items-center justify-between bg-[#e0e5ec] border-b border-gray-200 text-gray-800">
        {/* Search bar dengan style neumorphism */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Cari..."
            className="w-full p-3 rounded-xl bg-[#e0e5ec] text-gray-800 placeholder-gray-600
              shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] 
              outline-none"
          />
          <Search className="absolute right-3 top-3 text-gray-600" size={20} />
        </div>

        {/* Right icons dengan style neumorphism */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-xl bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
            transition-all duration-300">
            <Bell className="text-gray-600" size={20} />
          </button>

          <button
            className="p-2 rounded-xl bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
            transition-all duration-300"
            onClick={() => router.push('/admin/profile')}
          >
            <UserCircle className="text-gray-600" size={20} />
          </button>
        </div>
      </header>
    </>
  );
}
