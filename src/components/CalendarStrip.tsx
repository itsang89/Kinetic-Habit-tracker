'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useKineticStore, DayOfWeek } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import { getCompletionStatus, CompletionStatus } from '@/lib/completionUtils';
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

import { useMounted } from '@/hooks/useMounted';

export default function CalendarStrip({ selectedDate, onDateSelect }: CalendarStripProps) {
  const { habitLogs, habits, skipLogs } = useKineticStore();
  const [baseDate, setBaseDate] = useState(new Date());
  const mounted = useMounted();

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
    const startOfWeek = new Date(weekDates[0] || new Date());
    const endOfWeek = new Date(weekDates[6] || new Date());
    return today >= startOfWeek && today <= endOfWeek;
  }, [weekDates]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) {
      goToPreviousWeek();
    } else if (info.offset.x < -50) {
      if (!isCurrentWeek) {
        goToNextWeek();
      }
    }
  };

  const getDayStatus = (date: Date): CompletionStatus | 'none' => {
    const dateString = getLocalDateKey(date);
    
    // Check if any habit was scheduled for this day AND existed on this day
    const dayHabits = habits.filter(h => {
      const parseDate = (dStr: string) => {
        if (!dStr) return new Date();
        if (dStr.includes('T')) return new Date(dStr);
        const [y, m, d] = dStr.split('-').map(Number);
        return new Date(y ?? 0, ((m ?? 1) - 1), d ?? 1);
      };
      const habitCreatedDate = parseDate(h.createdAt);
      habitCreatedDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return habitCreatedDate <= checkDate;
    });

    const statuses = dayHabits.map(h => {
      const log = habitLogs.find(l => !l.deletedAt && l.habitId === h.id && l.completedAt.startsWith(dateString));
      const skipLog = skipLogs.find(l => !l.deletedAt && l.habitId === h.id && l.dateKey === dateString);
      return getCompletionStatus(log, skipLog, h, dateString);
    }).filter(s => s !== 'not-scheduled');

    if (statuses.length === 0) return 'none';

    if (statuses.every(s => s === 'complete' || s === 'skipped')) return 'complete';
    if (statuses.some(s => s === 'complete' || s === 'partial' || s === 'skipped')) return 'partial';
    if (statuses.every(s => s === 'missed')) return 'missed';
    
    return 'none';
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

  const handleTodayClick = () => {
    const today = new Date();
    setBaseDate(today);
    onDateSelect(today);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">
          {weekDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-4">
          {!isCurrentWeek && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={handleTodayClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand-main)]/15 border border-[var(--brand-main)]/30 text-[var(--brand-main)] text-xs font-medium hover:bg-[var(--brand-main)]/25 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Today
            </motion.button>
          )}
          <button onClick={goToPreviousWeek} className="p-1 hover:bg-[var(--brand-main)]/15 rounded-full transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
          <button onClick={goToNextWeek} className="p-1 hover:bg-[var(--brand-main)]/15 rounded-full transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
        </div>
      </div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="surface-card flex justify-between items-center rounded-2xl p-4 touch-none cursor-grab active:cursor-grabbing"
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
                key={getLocalDateKey(date)} 
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
                    ${isDateSelected ? 'ring-1 ring-[var(--brand-main)] ring-offset-2 ring-offset-[var(--bg-base)]' : ''}
                    ${status === 'complete' ? 'bg-[var(--brand-main)] text-[var(--bg-base)]' : ''}
                    ${status === 'partial' ? 'bg-[var(--brand-main)]/30 text-[var(--theme-text-primary)]' : ''}
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
