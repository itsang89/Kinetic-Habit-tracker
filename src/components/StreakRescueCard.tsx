'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { DayOfWeek, useKineticStore } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import { getCompletionStatus } from '@/lib/completionUtils';
import { useMounted } from '@/hooks/useMounted';

interface StreakRescueCardProps {
  date: string;
}

export default function StreakRescueCard({ date }: StreakRescueCardProps) {
  const { habits, getHabitProgress, habitLogs, skipLogs } = useKineticStore();
  const mounted = useMounted();

  const { rescueList, isToday } = useMemo(() => {
    if (!mounted) return { rescueList: [], isToday: false };

    const selectedDate = new Date(`${date}T12:00:00`);
    const viewDate = new Date(selectedDate);
    viewDate.setHours(0, 0, 0, 0);
    const today = getLocalDateKey();
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()] as DayOfWeek;

    const dueHabits = habits
      .filter((h) => !h.deletedAt && !h.isArchived)
      .map((habit) => {
        const log = habitLogs.find(l => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(date));
        const skipLog = skipLogs.find(l => !l.deletedAt && l.habitId === habit.id && l.dateKey === date);
        const status = getCompletionStatus(log, skipLog, habit, date);
        const progress = getHabitProgress(habit.id, date);
        return { habit, status, progress };
      })
      .filter(({ status }) => status === 'missed' || status === 'partial')
      .sort((a, b) => b.habit.streak - a.habit.streak)
      .slice(0, 3);

    return {
      rescueList: dueHabits,
      isToday: date === today,
    };
  }, [mounted, habits, getHabitProgress, date]);

  if (!mounted || !isToday) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass p-5 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--theme-foreground)]/7 border border-[var(--theme-border)] flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">Streak Rescue</h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">Protect today&apos;s momentum</p>
          </div>
        </div>
      </div>

      {rescueList.length === 0 ? (
        <p className="text-sm text-[var(--theme-text-secondary)]">
          All scheduled habits are complete for today.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rescueList.map(({ habit, progress }) => (
            <Link
              key={habit.id}
              href={`/habits/${habit.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-foreground)]/[0.02] px-3 py-2.5 hover:bg-[var(--theme-foreground)]/[0.06] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-[var(--theme-text-primary)]">{habit.name}</p>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                  {progress.current}/{progress.target} {habit.unit} • {habit.streak} day streak
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
