import React from 'react';

export interface Notification {
  message: string;
  time: string;
}

interface LatestNotificationsProps {
  notifications: Notification[];
}

export default function LatestNotifications({ notifications }: LatestNotificationsProps) {
  return (
    <div className="bg-[#e0e5ec] rounded-2xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Notifikasi Terbaru</h2>
        <button 
          className="text-sm text-gray-600 px-4 py-2 rounded-xl
            bg-[#e0e5ec]
            shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]
            hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]
            transition-all duration-300"
        >
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map((notif, i) => (
          <div 
            key={i} 
            className="bg-[#e0e5ec] p-4 rounded-xl
              shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]"
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]" />
              <div className="flex-1">
                <p className="text-gray-700 mb-1">{notif.message}</p>
                <span className="text-sm text-gray-500">{notif.time}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center p-4 bg-[#e0e5ec] rounded-xl shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
            <p className="text-gray-600">Tidak ada notifikasi baru</p>
          </div>
        )}
      </div>
    </div>
  );
}
