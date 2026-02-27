'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Coffee, Plane, MessageSquare, Trash2 } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';

interface SkipSheetProps {
  habitId: string;
  habitName: string;
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
  isSkipped: boolean;
}

const REASONS = [
  { id: 'Busy', label: 'Busy', icon: Clock },
  { id: 'Tired', label: 'Tired', icon: Coffee },
  { id: 'Travelling', label: 'Travelling', icon: Plane },
  { id: 'Other', label: 'Other', icon: MessageSquare },
];

export default function SkipSheet({
  habitId,
  habitName,
  dateKey,
  isOpen,
  onClose,
  isSkipped,
}: SkipSheetProps) {
  const { logSkip, removeSkip, setGlobalModalOpen } = useKineticStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [isOpen, setGlobalModalOpen]);

  const handleReasonSelect = async (reason: string) => {
    await logSkip(habitId, dateKey, reason);
    onClose();
  };

  const handleRemoveSkip = async () => {
    await removeSkip(habitId, dateKey);
    onClose();
  };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--bg-base)]/60 backdrop-blur-md pointer-events-auto"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg glass border-t border-[var(--theme-border)] rounded-t-[2.5rem] p-8 pb-12 shadow-2xl z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-[var(--theme-border)]/50" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                  Skip Habit
                </h2>
                <p className="text-[var(--theme-text-secondary)] text-sm mt-1">
                  Why are you skipping "{habitName}" today?
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
              >
                <X className="w-6 h-6 text-[var(--theme-text-secondary)]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <motion.button
                    key={reason.id}
                    whileHover={{ scale: 1.02, backgroundColor: 'var(--brand-main)/0.1' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReasonSelect(reason.id)}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-foreground)]/5 hover:border-[var(--brand-main)]/50 transition-all gap-3"
                  >
                    <div className="p-3 rounded-2xl bg-[var(--brand-main)]/10 text-[var(--brand-main)]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-[var(--theme-text-primary)]">{reason.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {isSkipped && (
              <button
                onClick={handleRemoveSkip}
                className="w-full py-4 rounded-2xl border border-[var(--color-error)]/30 text-[var(--color-error)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-error)]/5 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                Remove Skip
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(sheetContent, document.body);
}
