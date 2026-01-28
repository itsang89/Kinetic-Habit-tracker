import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Trophy } from 'lucide-react';
import { Habit } from '@/store/useKineticStore';

interface HabitDetailStatsProps {
  habit: Habit;
  successRate: number;
}

export default function HabitDetailStats({ habit, successRate }: HabitDetailStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-6 mt-6"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Flame className="w-4 h-4 text-[var(--theme-text-primary)]" fill="currentColor" />
          <span className="text-xl font-bold text-[var(--theme-text-primary)]">{habit.streak}</span>
        </div>
        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Current Streak</p>
      </div>
      <div className="w-px h-8 bg-[var(--theme-border)]" />
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Target className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          <span className="text-xl font-bold text-[var(--theme-text-primary)]">{Math.round(successRate)}%</span>
        </div>
        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Success Rate</p>
      </div>
      <div className="w-px h-8 bg-[var(--theme-border)]" />
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Trophy className="w-4 h-4 text-[var(--theme-text-muted)]" />
          <span className="text-xl font-bold text-[var(--theme-text-secondary)]">{habit.bestStreak}</span>
        </div>
        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Best Streak</p>
      </div>
    </motion.div>
  );
}
