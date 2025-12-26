'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKineticStore } from '@/store/useKineticStore';
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CalendarStrip({ selectedDate, onDateSelect }: CalendarStripProps) {
  const { habitLogs, habits } = useKineticStore();
  const [baseDate, setBaseDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const weekDates = useMemo(() => {
    const dates = [];
    const tempDate = new Date(baseDate);
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(tempDate.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [baseDate]);

  const goToPreviousWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() - 7);
    setBaseDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + 7);
    setBaseDate(newDate);
  };

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(weekDates[0]);
    const endOfWeek = new Date(weekDates[6]);
    return today >= startOfWeek && today <= endOfWeek;
  }, [weekDates]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 50) {
      goToPreviousWeek();
    } else if (info.offset.x < -50) {
      if (!isCurrentWeek) {
        goToNextWeek();
      }
    }
  };

  const getDayStatus = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Don't mark future dates as missed
    if (checkDate > today) return 'none';

    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as any;
    
    // Check if any habit was scheduled for this day AND existed on this day
    const scheduledHabits = habits.filter(h => {
      const habitCreatedDate = new Date(h.createdAt);
      habitCreatedDate.setHours(0, 0, 0, 0);
      return h.schedule.includes(dayOfWeek) && habitCreatedDate <= checkDate;
    });
    
    if (scheduledHabits.length === 0) return 'none';

    // Check completion
    const completedCount = scheduledHabits.filter(h => 
      habitLogs.some(l => l.habitId === h.id && l.completedAt.startsWith(dateString))
    ).length;

    if (completedCount === scheduledHabits.length) return 'complete';
    if (completedCount > 0) return 'partial';
    
    // Only mark as missed if it's in the past
    return 'missed';
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return isSameDay(date, selectedDate);
  };

  if (!mounted) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">
          {weekDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-4">
          <button onClick={goToPreviousWeek} className="p-1 hover:bg-[var(--theme-foreground)]/10 rounded-full transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
          <button onClick={goToNextWeek} className="p-1 hover:bg-[var(--theme-foreground)]/10 rounded-full transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
        </div>
      </div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="flex justify-between items-center bg-[var(--theme-foreground)]/[0.03] rounded-2xl p-4 border border-[var(--theme-border)] touch-none cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {weekDates.map((date, i) => {
            const status = getDayStatus(date);
            const isCurrentDay = isToday(date);
            const isDateSelected = isSelected(date);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            const isFuture = checkDate > today;

            return (
              <motion.div 
                key={date.toISOString()} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2 relative"
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrentDay ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
                
                <button 
                  onClick={() => onDateSelect(date)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all relative
                    ${isDateSelected ? 'ring-1 ring-[var(--theme-foreground)] ring-offset-2 ring-offset-[var(--theme-background)]' : ''}
                    ${status === 'complete' ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : ''}
                    ${status === 'partial' ? 'bg-[var(--theme-foreground)]/30 text-[var(--theme-text-primary)]' : ''}
                    ${status === 'missed' && !isFuture ? 'bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-[var(--theme-text-secondary)]' : ''}
                    ${status === 'none' || isFuture ? 'bg-transparent text-[var(--theme-text-muted)]' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
