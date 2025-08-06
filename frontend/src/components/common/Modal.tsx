// file: components/common/Modal.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  const modalRootRef = useRef<HTMLElement | null>(null);
  const [isPortalReady, setIsPortalReady] = useState(false);

  useEffect(() => {
    modalRootRef.current = document.getElementById('modal-root');
    setIsPortalReady(!!modalRootRef.current);
  }, []);

  useEffect(() => {
    // Hanya kunci scroll jika modal open dan portal siap
    if (isOpen && isPortalReady) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isPortalReady]);

  if (!isOpen || !isPortalReady || !modalRootRef.current) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md h-auto max-h-[90vh] flex flex-col bg-[#e0e5ec] rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Struktur Header, Content, Footer kini menjadi tanggung jawab Modal, 
              bukan lagi form di dalamnya.
            */}
            {title && (
              <header className="flex-shrink-0 p-4 border-b border-gray-300/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200/70 hover:text-gray-800 transition-colors">
                  <X size={20}/>
                </button>
              </header>
            )}
            
            {/* Area ini akan diisi oleh children, yaitu PayCustomerDebtForm */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRootRef.current
  );
};