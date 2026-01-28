import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

interface DayData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isScheduled: boolean;
  isCompleted: boolean;
  isPartial: boolean;
  isShielded: boolean;
  value: number | null;
  isFuture: boolean;
  isBeforeCreation: boolean;
}

interface HabitCalendarProps {
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  calendarData: DayData[];
}

export default function HabitCalendar({ calendarMonth, onMonthChange, calendarData }: HabitCalendarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass p-6 rounded-2xl mb-4"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--theme-text-primary)]" />
          <h2 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-widest">History</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
            className="p-1 rounded hover:bg-[var(--theme-foreground)]/10"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
          <span className="text-sm text-[var(--theme-text-secondary)] min-w-[120px] text-center">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => onMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
            className="p-1 rounded hover:bg-[var(--theme-foreground)]/10"
          >
            <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--theme-text-muted)] font-bold py-2">{d}</div>
        ))}
        {calendarData.map((day, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {day.isCurrentMonth ? (
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium relative
                ${!day.isScheduled || day.isFuture || day.isBeforeCreation ? 'text-[var(--theme-text-muted)]' : ''}
                ${day.isCompleted && !day.isPartial ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : ''}
                ${day.isPartial ? 'bg-[var(--theme-foreground)]/50 text-[var(--theme-text-primary)]' : ''}
                ${day.isScheduled && !day.isCompleted && !day.isFuture && !day.isBeforeCreation ? 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] border border-[var(--theme-border)]' : ''}
                ${day.isShielded ? 'ring-2 ring-blue-500' : ''}
              `}>
                {day.isShielded && <Shield className="absolute -top-1 -right-1 w-3 h-3 text-blue-400" />}
                {day.day}
              </div>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]" />
          <span className="text-[10px] text-[var(--theme-text-secondary)]">Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]/50" />
          <span className="text-[10px] text-[var(--theme-text-secondary)]">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]" />
          <span className="text-[10px] text-[var(--theme-text-secondary)]">Missed</span>
        </div>
      </div>
    </motion.div>
  );
}
