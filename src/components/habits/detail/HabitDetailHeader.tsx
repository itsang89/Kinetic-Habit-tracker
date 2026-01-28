import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Edit3, Star } from 'lucide-react';
import { Habit } from '@/store/useKineticStore';
import { HABIT_ICON_MAP } from '@/lib/habitIcons';

interface HabitDetailHeaderProps {
  habit: Habit;
  health: number;
  onEdit: () => void;
}

export default function HabitDetailHeader({ habit, health, onEdit }: HabitDetailHeaderProps) {
  const Icon = HABIT_ICON_MAP[habit.icon] || Star;

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <Link 
          href="/habits"
          className="flex items-center gap-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <button 
          onClick={onEdit}
          className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
        >
          <Edit3 className="w-5 h-5 text-[var(--theme-text-secondary)]" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48" cy="48" r="42"
              fill="none" stroke="var(--theme-foreground)" strokeOpacity="0.1" strokeWidth="6"
            />
            <motion.circle
              cx="48" cy="48" r="42"
              fill="none" stroke="var(--theme-foreground)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - health / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ filter: 'drop-shadow(0 0 8px var(--theme-glow))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-10 h-10 text-[var(--theme-text-primary)]" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-[var(--theme-text-primary)] mb-1">{habit.name}</h1>
        <p className="text-sm text-[var(--theme-text-secondary)]">{habit.target} {habit.unit}/day</p>
      </motion.div>
    </>
  );
}
