'use client';

import * as React from 'react';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Flame, MoreHorizontal } from 'lucide-react';
import { Habit, useKineticStore } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import KineticSlider from './habits/KineticSlider';
import MultiTapCapacitor from './habits/MultiTapCapacitor';
import SkipSheet from './habits/SkipSheet';

interface HabitCardProps {
  habit: Habit;
  index: number;
  date?: string; // Format: YYYY-MM-DD
}

function HabitCardComponent({ habit, index, date }: HabitCardProps) {
  const {
    logHabitCompletion,
    removeHabitCompletion,
    getHabitProgress,
    logSkip,
    removeSkip,
    isHabitCompletedOnDate,
  } = useKineticStore();
  const targetDateKey = date || getLocalDateKey();
  const todayString = getLocalDateKey();
  const isToday = targetDateKey === todayString;
  
  const { current, percent } = getHabitProgress(habit.id, targetDateKey);
  const isCompleted = percent >= 100;
  const isSkipped = useKineticStore(state => 
    state.skipLogs.some(l => !l.deletedAt && l.habitId === habit.id && l.dateKey === targetDateKey)
  );
  
  const [showSkipSheet, setShowSkipSheet] = useState(false);

  const handleToggleComplete = async () => {
    if (habit.type !== 'simple' && habit.type !== 'duration' && habit.type !== 'count') return;

    if (isCompleted) {
      await removeHabitCompletion(habit.id, targetDateKey);
    } else {
      await logHabitCompletion(habit.id, habit.target, targetDateKey);
    }
  };

  const handleValueChange = async (newValue: number) => {
      if (newValue === 0) {
          await removeHabitCompletion(habit.id, targetDateKey);
      } else {
          await logHabitCompletion(habit.id, newValue, targetDateKey);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      onClick={(habit.type === 'simple' || habit.type === 'duration' || habit.type === 'count') ? handleToggleComplete : undefined}
      className={`
        glass depth-hover group p-5 relative overflow-hidden border transition-all duration-300
        ${(habit.type === 'simple' || habit.type === 'duration' || habit.type === 'count') ? 'cursor-pointer' : ''}
        ${isCompleted 
            ? 'border-[var(--brand-main)] bg-[var(--brand-main)]/[0.12]' 
            : 'border-[var(--theme-border)] hover:border-[var(--brand-main)]/50'
        }
      `}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 flex-1">
          {/* Checkbox (Simple, Duration, and Count) */}
          {(habit.type === 'simple' || habit.type === 'duration' || habit.type === 'count') && (
            <motion.div
                className={`
                w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-300
                ${isCompleted 
                    ? 'bg-[var(--brand-main)] border-[var(--brand-main)] text-[var(--bg-base)]' 
                    : 'border-[var(--brand-main)]/30 group-hover:border-[var(--brand-main)]'
                }
                `}
            >
                {isCompleted && <Check className="w-4 h-4" strokeWidth={4} />}
            </motion.div>
          )}

          <div className="min-w-0">
            <h3 className={`font-semibold text-lg tracking-tight truncate transition-colors ${isCompleted ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-primary)]/80'}`}>
              {habit.name}
            </h3>
            
            {/* Simple Stats/Schedule */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                {habit.type === 'simple' ? `${habit.target} ${habit.unit}` : `${Math.round(percent)}% Complete`}
              </span>
              
              <div className="flex gap-[2px]">
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => (
                  <div
                    key={day}
                    className={`
                      w-1 h-1 rounded-full
                      ${habit.schedule.includes(day) 
                        ? 'bg-[var(--theme-text-secondary)]' 
                        : 'bg-[var(--brand-main)]/15'
                      }
                    `}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4">
          {/* Streak */}
          {habit.streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-main)]/12 rounded-full border border-[var(--border-subtle)]">
              <Flame className="w-3.5 h-3.5 text-[#FF5733]" fill="currentColor" />
              <span className="text-[var(--brand-main)] text-xs font-bold">{habit.streak}</span>
            </div>
          )}

          {/* More options (Skip) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSkipSheet(true);
            }}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${isSkipped 
                ? 'bg-[var(--brand-main)] text-[var(--bg-base)]' 
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10'
              }
            `}
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      
      {/* Complex Habit Interactions */}
      {(habit.type === 'duration' || habit.type === 'count') && (
          <div 
            className="mt-4 pt-4 border-t border-[var(--theme-border)]"
            onClick={(e) => e.stopPropagation()}
          >
              {habit.type === 'duration' && (
                  <KineticSlider 
                      value={current} 
                      max={habit.target} 
                      unit={habit.unit}
                      onChange={handleValueChange}
                  />
              )}
              {habit.type === 'count' && (
                  <div className="flex justify-center">
                    <MultiTapCapacitor 
                        value={current} 
                        max={habit.target} 
                        unit={habit.unit}
                        onChange={handleValueChange}
                    />
                  </div>
              )}
          </div>
      )}

      {/* Background fill animation (Only for 100% complete) */}
      {isCompleted && (
         <motion.div 
            layoutId={`bg-${habit.id}`}
            className="absolute inset-0 bg-gradient-to-r from-[var(--brand-main)]/[0.12] to-transparent pointer-events-none"
         />
      )}

      <SkipSheet 
        habitId={habit.id}
        habitName={habit.name}
        dateKey={targetDateKey}
        isOpen={showSkipSheet}
        onClose={() => setShowSkipSheet(false)}
        isSkipped={isSkipped}
      />
    </motion.div>
  );
}

export default memo(HabitCardComponent);
