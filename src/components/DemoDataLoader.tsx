'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useKineticStore } from '@/store/useKineticStore';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useMounted } from '@/hooks/useMounted';

export default function DemoDataLoader() {
  const habits = useKineticStore((s) => s.habits);
  const habitLogs = useKineticStore((s) => s.habitLogs);
  const loadDemoData = useKineticStore((s) => s.loadDemoData);
  const clearAllData = useKineticStore((s) => s.clearAllData);
  const [showButton, setShowButton] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    const activeHabits = habits.filter((h) => !h.deletedAt);
    if (mounted && activeHabits.length === 0 && habitLogs.length === 0) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [mounted, habits, habitLogs]);

  const resetAndLoadDemo = async () => {
    await clearAllData();
    setTimeout(() => void loadDemoData(), 100);
  };

  const activeHabits = habits.filter((h) => !h.deletedAt);
  const hasData = activeHabits.length > 0 || habitLogs.length > 0;

  if (!mounted) return null;

  return (
    <>
      {showButton && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadDemoData()}
          className="fixed bottom-24 right-8 px-5 py-3 rounded-full bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_var(--theme-glow)] hover:shadow-[0_0_30px_var(--theme-glow)] transition-all z-50 uppercase tracking-wide"
        >
          <Play className="w-4 h-4 fill-current" />
          Load Demo
        </motion.button>
      )}
      {hasData && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetAndLoadDemo}
          className="fixed bottom-24 right-8 px-4 py-2 rounded-full bg-[var(--theme-dark)] text-[var(--theme-text-secondary)] font-medium text-xs flex items-center gap-2 border border-[var(--theme-border)] hover:border-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] transition-all z-50 uppercase tracking-wide"
        >
          <Play className="w-3 h-3" />
          Reset Demo
        </motion.button>
      )}
    </>
  );
}
