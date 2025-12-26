'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplet, Book, Brain, Dumbbell, Heart, Sun, Moon, Coffee, Pencil, Code, Music, Leaf, Target, Zap, Star, Shield, ToggleLeft, Timer, Hash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Habit, HabitIcon, HabitCategory, DayOfWeek, HabitType, useKineticStore } from '@/store/useKineticStore';

const iconOptions: { icon: HabitIcon; component: React.ElementType }[] = [
  { icon: 'droplet', component: Droplet },
  { icon: 'book', component: Book },
  { icon: 'brain', component: Brain },
  { icon: 'dumbbell', component: Dumbbell },
  { icon: 'heart', component: Heart },
  { icon: 'sun', component: Sun },
  { icon: 'moon', component: Moon },
  { icon: 'coffee', component: Coffee },
  { icon: 'pencil', component: Pencil },
  { icon: 'code', component: Code },
  { icon: 'music', component: Music },
  { icon: 'leaf', component: Leaf },
  { icon: 'target', component: Target },
  { icon: 'zap', component: Zap },
  { icon: 'star', component: Star },
  { icon: 'shield', component: Shield },
];

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
  
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState(1);
  const [schedule, setSchedule] = useState<DayOfWeek[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [category, setCategory] = useState<HabitCategory>('other');
  const [icon, setIcon] = useState<HabitIcon>('star');
  const [type, setType] = useState<HabitType>('simple');

  useEffect(() => {
    if (isOpen) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [isOpen, setGlobalModalOpen]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setUnit(habit.unit);
      setTarget(habit.target);
      setSchedule(habit.schedule);
      setCategory(habit.category);
      setIcon(habit.icon);
      setType(habit.type || 'simple');
    } else {
      // Reset for new habit
      setName('');
      setUnit('times');
      setTarget(1);
      setSchedule(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setCategory('other');
      setIcon('star');
      setType('simple');
    }
  }, [habit, isOpen]);

  // Handle type change defaults
  const handleTypeChange = (newType: HabitType) => {
      setType(newType);
      if (newType === 'simple') {
          setTarget(1);
          setUnit('time');
      } else if (newType === 'duration') {
          setTarget(30); // Default to 30 mins
          setUnit('minutes');
      } else if (newType === 'count') {
          setTarget(8);
          setUnit('cups');
      }
  };

  const toggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || schedule.length === 0) return;

    if (habit) {
      await updateHabit(habit.id, {
        name: name.trim(),
        unit,
        target,
        schedule,
        category,
        icon,
        type,
      });
    } else {
      await addHabit({
        name: name.trim(),
        unit,
        target,
        schedule,
        category,
        icon,
        type,
      });
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">
                {habit ? 'Edit Habit' : 'New Habit'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
              >
                <X className="w-5 h-5 text-[var(--theme-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Drink Water"
                  className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors"
                />
              </div>
              
              {/* Habit Type */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                  Habit Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTypeChange(value)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all
                        ${type === value 
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                          : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)]'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target & Unit (Conditional) */}
              {type !== 'simple' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                        {type === 'duration' ? 'Target (Minutes)' : 'Target Count'}
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={target}
                        onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors"
                    />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                        Unit
                    </label>
                    <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder={type === 'duration' ? "minutes" : "cups"}
                        className="w-full bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-foreground)]/30 transition-colors"
                    />
                    </div>
                </div>
              )}

              {/* Icon Selection */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map(({ icon: iconValue, component: IconComponent }) => (
                    <button
                      key={iconValue}
                      type="button"
                      onClick={() => setIcon(iconValue)}
                      className={`
                        p-3 rounded-xl transition-all
                        ${icon === iconValue 
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                          : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)]'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categoryOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`
                        px-3 py-2 rounded-xl text-sm font-medium transition-all
                        ${category === value 
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' 
                          : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 hover:text-[var(--theme-text-primary)]'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-2">
                  Schedule
                </label>
                <div className="flex gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`
                        flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                        ${schedule.includes(day)
                          ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]'
                          : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10'
                        }
                      `}
                    >
                      {day.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!name.trim() || schedule.length === 0}
                className="w-full py-4 rounded-2xl bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold text-sm uppercase tracking-wide hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {habit ? 'Save Changes' : 'Create Habit'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
