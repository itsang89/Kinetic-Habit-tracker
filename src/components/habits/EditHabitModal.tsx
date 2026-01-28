'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ToggleLeft, Timer, Hash } from 'lucide-react';
import { useEffect } from 'react';
import { Habit, HabitCategory, DayOfWeek, HabitType, useKineticStore } from '@/store/useKineticStore';
import { HABIT_ICON_OPTIONS } from '@/lib/habitIcons';
import { useHabitForm } from '@/hooks/useHabitForm';

const categoryOptions: { value: HabitCategory; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Other' },
];

const dayOptions: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeOptions: { value: HabitType; label: string; icon: React.ElementType }[] = [
  { value: 'simple', label: 'Simple', icon: ToggleLeft },
  { value: 'duration', label: 'Duration', icon: Timer },
  { value: 'count', label: 'Count', icon: Hash },
];

interface EditHabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditHabitModal({ habit, isOpen, onClose }: EditHabitModalProps) {
  const { updateHabit, addHabit, setGlobalModalOpen } = useKineticStore();
  
  const {
    name, setName,
    unit, setUnit,
    target, setTarget,
    schedule, handleToggleDay,
    category, setCategory,
    icon, setIcon,
    type, handleTypeChange,
    validationError,
    validate
  } = useHabitForm(habit, isOpen);

  useEffect(() => {
    if (isOpen) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [isOpen, setGlobalModalOpen]);

  const handleSave = async () => {
    const formData = validate();
    if (!formData) return;

    if (habit) {
      await updateHabit(habit.id, formData);
    } else {
      await addHabit(formData);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[var(--theme-background)]/80 backdrop-blur-md border-b border-[var(--theme-border)]">
              <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">
                {habit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
              >
                <X className="w-6 h-6 text-[var(--theme-text-secondary)]" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Habit Name & Type */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter habit name..."
                    className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-2xl px-4 py-4 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors text-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-3">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {typeOptions.map((option) => {
                      const TypeIcon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleTypeChange(option.value)}
                          className={`
                            flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all
                            ${type === option.value 
                              ? 'bg-[var(--theme-foreground)]/10 border-[var(--theme-foreground)] text-[var(--theme-text-primary)]' 
                              : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
                            }
                          `}
                        >
                          <TypeIcon className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-tighter">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Goal & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-2">
                    Goal
                  </label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                    className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-2xl px-4 py-4 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. times, mins"
                    className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-2xl px-4 py-4 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors text-lg"
                  />
                </div>
              </div>

              {/* Icon & Category */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-3">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {HABIT_ICON_OPTIONS.map((option) => {
                      const IconComp = option.component;
                      return (
                        <button
                          key={option.icon}
                          onClick={() => setIcon(option.icon)}
                          className={`
                            aspect-square rounded-xl flex items-center justify-center transition-all
                            ${icon === option.icon 
                              ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)] scale-110 shadow-lg shadow-[var(--theme-glow)]' 
                              : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
                            }
                          `}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-3">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCategory(option.value)}
                        className={`
                          px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
                          ${category === option.value 
                            ? 'bg-[var(--theme-foreground)]/10 border-[var(--theme-foreground)] text-[var(--theme-text-primary)]' 
                            : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-3">
                  Schedule
                </label>
                <div className="flex justify-between gap-1">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleToggleDay(day)}
                      className={`
                        flex-1 aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border
                        ${schedule.includes(day) 
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)] border-[var(--theme-foreground)]' 
                          : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-foreground)]/10'
                        }
                      `}
                    >
                      {day.substring(0, 1)}
                    </button>
                  ))}
                </div>
              </div>

              {validationError && (
                <p className="text-red-400 text-sm font-medium text-center">{validationError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-bold uppercase tracking-wider text-sm hover:bg-[var(--theme-foreground)]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] py-4 rounded-2xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--theme-glow)]"
                >
                  {habit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
