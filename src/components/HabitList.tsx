'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ListChecks } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKineticStore, DayOfWeek, Habit } from '@/store/useKineticStore';
import HabitCard from './HabitCard';

import { useMounted } from '@/hooks/useMounted';

interface HabitListProps {
  date?: string; // Format: YYYY-MM-DD
}

export default function HabitList({ date }: HabitListProps) {
  const { habits, isHabitCompletedOnDate } = useKineticStore();
  const router = useRouter();
  const mounted = useMounted();
  const [todayDay, setTodayDay] = useState<DayOfWeek>('Mon');
  const [initialCompletionMap, setInitialCompletionMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const targetDate = date ? new Date(date) : new Date();
    const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setTodayDay(days[targetDate.getDay()] || 'Mon');
  }, [date]);

  // Capture initial completion states when the component mounts or date changes
  // This prevents habits from jumping around while the user is interacting with them
  useEffect(() => {
    if (mounted) {
      const targetDate = date || new Date().toISOString().split('T')[0] || '';
      const map: Record<string, boolean> = {};
      habits.forEach(h => {
        map[h.id] = isHabitCompletedOnDate(h.id, targetDate);
      });
      setInitialCompletionMap(map);
    }
  }, [date, mounted, habits, isHabitCompletedOnDate]);

  // Filter habits scheduled for today AND existed on this day
  const todaysHabits = useMemo(() => {
    if (!mounted) return [];
    
    return habits
      .filter((h) => {
        const habitCreatedDate = new Date(h.createdAt);
        habitCreatedDate.setHours(0, 0, 0, 0);
        const viewDate = date ? new Date(date + 'T12:00:00') : new Date();
        viewDate.setHours(0, 0, 0, 0);
        
        return h.schedule.includes(todayDay) && habitCreatedDate <= viewDate;
      })
      .sort((a, b) => {
          // Use the initial completion status for sorting to keep items in place
          // They will only "sink" to the bottom the next time the page is loaded/opened
          const defaultDate = new Date().toISOString().split('T')[0] || '';
          const aCompleted = initialCompletionMap[a.id] ?? isHabitCompletedOnDate(a.id, date || defaultDate);
          const bCompleted = initialCompletionMap[b.id] ?? isHabitCompletedOnDate(b.id, date || defaultDate);
          
          if (aCompleted === bCompleted) return 0;
          return aCompleted ? 1 : -1; 
      });
  }, [mounted, habits, date, todayDay, initialCompletionMap, isHabitCompletedOnDate]);

  const otherHabits = useMemo(() => {
    if (!mounted) return [];
    return habits.filter((h) => !h.schedule.includes(todayDay));
  }, [mounted, habits, todayDay]);

  const todayStr = new Date().toISOString().split('T')[0] || '';
  const isToday = !date || date === todayStr;
  const isFuture = date ? date > todayStr : false;
  
  const displayDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: (date.split('-')[0] || '') !== new Date().getFullYear().toString() ? 'numeric' : undefined
  }) : '';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-8 min-h-[400px]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[var(--theme-foreground)]/5 flex items-center justify-center border border-[var(--theme-border)]">
                <ListChecks className="w-5 h-5 text-[var(--theme-text-primary)]" />
             </div>
            <div>
               <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">
                 {isToday ? "Today's Habits" : isFuture ? `Upcoming Habits: ${displayDate}` : `Habits for ${displayDate}`}
               </h2>
               <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-widest mt-1">
                 {isToday ? 'Stay Consistent' : isFuture ? 'Plan Ahead' : 'Past Performance'}
               </p>
            </div>
          </div>
          <Link
            href="/habits?add=true"
            className="px-4 py-2 rounded-full border border-[var(--theme-foreground)] text-[var(--theme-text-primary)] font-medium text-sm transition-colors flex items-center gap-2 hover:bg-[var(--theme-foreground)] hover:text-[var(--theme-background)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </Link>
        </div>

        {!mounted || habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 border border-dashed border-[var(--theme-border)] rounded-2xl bg-[var(--theme-foreground)]/[0.02]"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--theme-foreground)]/5 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[var(--theme-text-secondary)]" />
            </div>
            <p className="text-[var(--theme-text-secondary)] font-medium mb-1">Your journey starts here</p>
            <p className="text-[var(--theme-text-muted)] text-sm mb-6">Add a habit to begin tracking</p>
            <Link
              href="/habits?add=true"
              className="px-6 py-2.5 rounded-full bg-[var(--theme-foreground)] text-[var(--theme-background)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Create Habit
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Today's habits */}
            {todaysHabits.length > 0 ? (
              todaysHabits.map((habit: Habit, index: number) => (
                <HabitCard key={habit.id} habit={habit} index={index} date={date} />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
                 <p className="text-[var(--theme-text-secondary)] text-sm">No habits scheduled for this day</p>
              </div>
            )}

            {/* Other habits - Only show on current day */}
            {(!date || date === new Date().toISOString().split('T')[0]) && otherHabits.length > 0 && (
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-[var(--theme-border)]" />
                  <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-widest">Upcoming</span>
                  <div className="h-px flex-1 bg-[var(--theme-border)]" />
                </div>
                <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                   {otherHabits.map((habit: Habit, index: number) => (
                     <HabitCard
                       key={habit.id}
                       habit={habit}
                       index={todaysHabits.length + index}
                       date={date}
                     />
                   ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}
