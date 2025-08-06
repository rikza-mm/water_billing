'use client';

import React from 'react';
import { Download, Printer, Share2 } from 'lucide-react';

interface MobileActionButtonsProps {
  onExport: () => void;
  onPrint: () => void;
  onShare: () => void;
}

const MobileActionButtons: React.FC<MobileActionButtonsProps> = ({
  onExport,
  onPrint,
  onShare
}) => {
  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-50">
      <button
        onClick={onExport}
        className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 active:scale-95"
        title="Export PDF"
      >
        <Download className="h-5 w-5" />
      </button>
      <button
        onClick={onPrint}
        className="bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200 active:scale-95"
        title="Print"
      >
        <Printer className="h-5 w-5" />
      </button>
      <button
        onClick={onShare}
        className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-200 active:scale-95"
        title="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MobileActionButtons; 