'use client';

import { motion } from 'framer-motion';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';

export default function CompactStats() {
  const { momentumScore, habitLogs, habits } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Calculate today's completion
    const today = new Date();
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()] as any;
    const todaysHabits = habits.filter(h => h.schedule.includes(dayOfWeek));
    const todayString = today.toISOString().split('T')[0];
    
    if (todaysHabits.length > 0) {
      const completedCount = todaysHabits.filter(h => 
        habitLogs.some(l => l.habitId === h.id && l.completedAt.startsWith(todayString))
      ).length;
      setCompletionRate(Math.round((completedCount / todaysHabits.length) * 100));
    } else {
      setCompletionRate(0);
    }
  }, [mounted, habits, habitLogs]);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 rounded-xl flex items-center justify-between"
      >
        <div>
           <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold mb-1">Today's Focus</p>
           <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{completionRate}%</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--theme-foreground)]/5 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-[var(--theme-text-primary)]" />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-4 rounded-xl flex items-center justify-between"
      >
        <div>
           <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold mb-1">Momentum</p>
           <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{Math.round(momentumScore)}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--theme-foreground)]/5 flex items-center justify-center">
          <Flame className="w-5 h-5 text-[var(--theme-text-primary)]" />
        </div>
      </motion.div>
    </div>
  );
}
