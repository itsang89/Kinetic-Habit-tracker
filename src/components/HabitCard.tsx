'use client';

import { motion } from 'framer-motion';
import { Check, Shield, Flame, Trash2 } from 'lucide-react';
import { Habit, useKineticStore } from '@/store/useKineticStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import React, { useState, useEffect } from 'react';
import KineticSlider from './habits/KineticSlider';
import MultiTapCapacitor from './habits/MultiTapCapacitor';

interface HabitCardProps {
  habit: Habit;
  index: number;
  date?: string; // Format: YYYY-MM-DD
}

function HabitCardComponent({ habit, index, date }: HabitCardProps) {
  const { logHabitCompletion, removeHabitCompletion, getHabitProgress, useShield, deleteHabit, setGlobalModalOpen } = useKineticStore();
  const targetDate = date || new Date().toISOString().split('T')[0] || '';
  
  const { current, percent } = getHabitProgress(habit.id, targetDate);
  const isCompleted = percent >= 100;
  
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (showDeleteConfirm) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showDeleteConfirm, setGlobalModalOpen]);

  const handleToggleComplete = async () => {
    // allow one tap completion for simple, duration, and count habits
    if (habit.type !== 'simple' && habit.type !== 'duration' && habit.type !== 'count') return;

    if (isCompleted) {
      await removeHabitCompletion(habit.id, date);
    } else {
      await logHabitCompletion(habit.id, habit.target, date);
    }
  };

  const handleShield = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (habit.shieldAvailable) {
      await useShield(habit.id);
    }
  };

  const handleDelete = async () => {
    await deleteHabit(habit.id);
  };

  const handleValueChange = async (newValue: number) => {
      // If 0, maybe remove completion?
      if (newValue === 0) {
          await removeHabitCompletion(habit.id, date);
      } else {
          await logHabitCompletion(habit.id, newValue, date);
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
        glass group p-5 relative overflow-hidden border transition-all duration-300
        ${(habit.type === 'simple' || habit.type === 'duration' || habit.type === 'count') ? 'cursor-pointer' : ''}
        ${isCompleted 
            ? 'border-[var(--theme-foreground)] bg-[var(--theme-foreground)]/[0.08]' 
            : 'border-[var(--theme-border)] hover:border-[var(--theme-foreground)]/30'
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
                    ? 'bg-[var(--theme-foreground)] border-[var(--theme-foreground)] text-[var(--theme-background)]' 
                    : 'border-[var(--theme-foreground)]/30 group-hover:border-[var(--theme-foreground)]'
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
                        : 'bg-[var(--theme-foreground)]/10'
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-foreground)]/5 rounded-full border border-[var(--theme-border)]">
              <Flame className="w-3.5 h-3.5 text-[var(--theme-text-primary)]" fill="currentColor" />
              <span className="text-[var(--theme-text-primary)] text-xs font-bold">{habit.streak}</span>
            </div>
          )}

          {/* Shield button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShield}
            disabled={!habit.shieldAvailable}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${habit.shieldAvailable 
                ? 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10' 
                : 'text-[var(--theme-text-muted)] cursor-not-allowed'
              }
            `}
          >
            <Shield className="w-4 h-4" />
          </motion.button>

          {/* Delete button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: showDelete ? 1 : 0, scale: showDelete ? 1 : 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all"
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
      
      {/* Background fill animation (Only for 100% complete) */}
      {isCompleted && (
         <motion.div 
            layoutId={`bg-${habit.id}`}
            className="absolute inset-0 bg-gradient-to-r from-[var(--theme-foreground)]/[0.05] to-transparent pointer-events-none"
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

export default React.memo(HabitCardComponent);
