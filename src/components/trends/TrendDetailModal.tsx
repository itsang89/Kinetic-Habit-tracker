'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useKineticStore } from '@/store/useKineticStore';

interface TrendDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function TrendDetailModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children 
}: TrendDetailModalProps) {
  const { setGlobalModalOpen } = useKineticStore();

  useEffect(() => {
    if (isOpen) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [isOpen, setGlobalModalOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full md:max-w-4xl h-[92vh] md:h-auto md:max-h-[90vh] overflow-hidden rounded-t-[2.5rem] md:rounded-2xl flex flex-col"
          >
            {/* Handle for mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-[var(--theme-foreground)]/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-[var(--theme-border)]">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[var(--theme-text-primary)]">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-[var(--theme-text-secondary)] mt-1">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-xl bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
