'use client';

import * as React from 'react';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Flame, Trash2 } from 'lucide-react';
import { Habit, useKineticStore } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/ConfirmDialog';
import KineticSlider from './habits/KineticSlider';
import MultiTapCapacitor from './habits/MultiTapCapacitor';

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
    deleteHabit,
    setGlobalModalOpen,
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
  
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (showDeleteConfirm) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showDeleteConfirm, setGlobalModalOpen]);

  const handleToggleComplete = async () => {
    if (habit.type !== 'simple' && habit.type !== 'duration' && habit.type !== 'count') return;

    if (isCompleted) {
      await removeHabitCompletion(habit.id, targetDateKey);
    } else {
      await logHabitCompletion(habit.id, habit.target, targetDateKey);
    }
  };

  const handleDelete = async () => {
    await deleteHabit(habit.id);
  };

  const handleValueChange = async (newValue: number) => {
      if (newValue === 0) {
          await removeHabitCompletion(habit.id, targetDateKey);
      } else {
          await logHabitCompletion(habit.id, newValue, targetDateKey);
      }
  };

  const handleToggleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSkipped) {
      await removeSkip(habit.id, targetDateKey);
    } else {
      await logSkip(habit.id, targetDateKey);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      onClick={(habit.type === 'simple' || habit.type === 'duration' || habit.type === 'count') ? handleToggleComplete : undefined}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
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
              <Flame className="w-3.5 h-3.5 text-[var(--brand-main)]" fill="currentColor" />
              <span className="text-[var(--brand-main)] text-xs font-bold">{habit.streak}</span>
            </div>
          )}

          {/* Delete button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: showDelete ? 1 : 0, scale: showDelete ? 1 : 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--color-error)]/15 transition-all"
          >
            <Trash2 className="w-4 h-4" />
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

      {!isCompleted && isToday && (
        <div
          className="mt-4 pt-4 border-t border-[var(--theme-border)] flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleSkip}
            className={`
              px-4 py-1.5 rounded-full border text-xs font-medium transition-all
              ${isSkipped
                ? 'bg-[var(--theme-foreground)]/15 border-[var(--theme-foreground)]/30 text-[var(--theme-text-primary)] shadow-inner'
                : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
              }
            `}
          >
            {isSkipped ? 'Skipped' : 'Skip Habit'}
          </motion.button>
        </div>
      )}
      
      {/* Background fill animation (Only for 100% complete) */}
      {isCompleted && (
         <motion.div 
            layoutId={`bg-${habit.id}`}
            className="absolute inset-0 bg-gradient-to-r from-[var(--brand-main)]/[0.12] to-transparent pointer-events-none"
         />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Habit?"
        message={`Are you sure you want to delete "${habit.name}"? This will also delete all associated logs. This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </motion.div>
  );
}

export default memo(HabitCardComponent);
