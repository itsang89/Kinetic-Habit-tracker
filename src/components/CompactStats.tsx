'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useKineticStore, DayOfWeek } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import { Flame, CheckCircle2 } from 'lucide-react';

import { useMounted } from '@/hooks/useMounted';

export default function CompactStats() {
  const { momentumScore, habitLogs, habits } = useKineticStore();
  const mounted = useMounted();
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    
    // Calculate today's completion
    const today = new Date();
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()] as DayOfWeek;
    const todaysHabits = habits.filter(h => !h.isArchived && h.schedule.includes(dayOfWeek));
    const todayString = getLocalDateKey(today);
    
    if (todaysHabits.length > 0) {
      const completedCount = todaysHabits.filter(h => {
        const log = habitLogs.find(l => l.habitId === h.id && l.completedAt.startsWith(todayString));
        if (!log) return false;
        // Check if actually completed (value >= target)
        return (log.value / h.target) >= 1;
      }).length;
      setCompletionRate(Math.round((completedCount / todaysHabits.length) * 100));
    } else {
      setCompletionRate(0);
    }
  }, [mounted, habits, habitLogs]);

  if (!mounted) return null;

  return (
    <div className="flex gap-2 sm:flex-1 min-w-0">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass depth-hover flex-1 min-w-0 p-3 rounded-xl flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--brand-main)]/15 border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[var(--brand-main)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold">Today's Focus</p>
          <p className="text-lg font-bold text-[var(--theme-text-primary)] leading-tight">{completionRate}%</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass depth-hover flex-1 min-w-0 p-3 rounded-xl flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--brand-main)]/15 border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 text-[#FF5733]" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold">Momentum</p>
          <p className="text-lg font-bold text-[var(--theme-text-primary)] leading-tight">{Math.round(momentumScore)}</p>
        </div>
      </motion.div>
    </div>
  );
}
