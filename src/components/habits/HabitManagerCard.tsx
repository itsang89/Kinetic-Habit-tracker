'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  Droplet, Book, Brain, Dumbbell, Heart, Sun, Moon, Coffee, 
  Pencil, Code, Music, Leaf, Target, Zap, Star,
  Edit3, Archive, ArchiveRestore, ChevronRight
} from 'lucide-react';
import { Habit, HabitIcon, useKineticStore } from '@/store/useKineticStore';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const iconMap: Record<HabitIcon, React.ElementType> = {
  droplet: Droplet,
  book: Book,
  brain: Brain,
  dumbbell: Dumbbell,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  pencil: Pencil,
  code: Code,
  music: Music,
  leaf: Leaf,
  target: Target,
  zap: Zap,
  star: Star,
};

interface HabitManagerCardProps {
  habit: Habit;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export default function HabitManagerCard({ 
  habit, 
  isSelected, 
  isEditMode, 
  onSelect, 
  onEdit 
}: HabitManagerCardProps) {
  const router = useRouter();
  const { getWeeklyHabitData, archiveHabit, unarchiveHabit } = useKineticStore();
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const isDragging = useRef(false);
  
  const weeklyData = getWeeklyHabitData(habit.id);
  const Icon = iconMap[habit.icon] || Star;
  
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239, 68, 68, 0.2)', 'rgba(0, 0, 0, 0)', 'rgba(34, 197, 94, 0.2)']
  );

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80) {
      // Swipe right - Edit
      onEdit();
    } else if (info.offset.x < -80) {
      // Swipe left - Archive/Unarchive
      if (habit.isArchived) {
        await unarchiveHabit(habit.id);
      } else {
        await archiveHabit(habit.id);
      }
    }
    setShowActions(null);
    // Reset dragging flag after a short delay to prevent click
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 40) {
      setShowActions('right');
    } else if (info.offset.x < -40) {
      setShowActions('left');
    } else {
      setShowActions(null);
    }
  };

  const handleClick = () => {
    if (isDragging.current) return;
    if (isEditMode) {
      onSelect();
    } else {
      router.push(`/habits/${habit.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Swipe action backgrounds */}
      <motion.div 
        style={{ background }}
        className="absolute inset-0 rounded-xl"
      />
      
      {/* Left action (archive) */}
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${showActions === 'left' ? 'opacity-100' : 'opacity-0'}`}>
        {habit.isArchived ? (
          <ArchiveRestore className="w-6 h-6 text-green-400" />
        ) : (
          <Archive className="w-6 h-6 text-red-400" />
        )}
      </div>
      
      {/* Right action (edit) */}
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${showActions === 'right' ? 'opacity-100' : 'opacity-0'}`}>
        <Edit3 className="w-6 h-6 text-green-400" />
      </div>

      {/* Card content */}
      <motion.div
        drag={!isEditMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleClick}
        className={`
          relative glass p-4 rounded-xl cursor-pointer transition-all duration-200
          ${isSelected ? 'ring-2 ring-[var(--theme-foreground)]' : ''}
          ${habit.isArchived ? 'opacity-60' : ''}
          hover:bg-[var(--theme-foreground)]/[0.03]
        `}
      >
        <div className="flex items-center gap-4">
          {/* Edit mode checkbox */}
          {isEditMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${isSelected ? 'bg-[var(--theme-foreground)] border-[var(--theme-foreground)]' : 'border-[var(--theme-text-muted)]'}
              `}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3 h-3 bg-[var(--theme-background)] rounded-full"
                />
              )}
            </motion.div>
          )}

          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${habit.isArchived ? 'bg-[var(--theme-foreground)]/10' : 'bg-[var(--theme-foreground)]/10'}
          `}>
            <Icon className="w-6 h-6 text-[var(--theme-text-primary)]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--theme-text-primary)] truncate">{habit.name}</h3>
              {habit.isArchived && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] uppercase tracking-wider">
                  Paused
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--theme-text-secondary)]">
              {habit.target} {habit.unit}/day
            </p>
            
            {/* Mini sparkline - last 7 days */}
            <div className="flex items-center gap-1 mt-2">
              {weeklyData.map((day, i) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`
                    w-3 h-3 rounded-full
                    ${day.completed 
                      ? 'bg-[var(--theme-foreground)] shadow-[0_0_6px_var(--theme-glow)]' 
                      : 'bg-[var(--theme-foreground)]/20'
                    }
                  `}
                  title={day.date}
                />
              ))}
              <span className="text-[10px] text-[var(--theme-text-secondary)] ml-2">7d</span>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
            {habit.isArchived ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  await unarchiveHabit(habit.id);
                }}
                className="p-2 rounded-lg bg-[var(--theme-foreground)]/10 text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/20 transition-colors"
                title="Unpause Habit"
              >
                <ArchiveRestore className="w-5 h-5" />
              </motion.button>
            ) : (
              <>
                <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{habit.streak}</p>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Streak</p>
              </>
            )}
          </div>

          {/* Navigation indicator */}
          {!isEditMode && (
            <ChevronRight className="w-5 h-5 text-[var(--theme-text-muted)] flex-shrink-0" />
          )}
        </div>

        {/* Schedule badges */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--theme-border)]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span
              key={day}
              className={`
                text-[9px] px-1.5 py-0.5 rounded font-medium
                ${habit.schedule.includes(day as any)
                  ? 'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-primary)]'
                  : 'text-[var(--theme-text-muted)]'
                }
              `}
            >
              {day.charAt(0)}
            </span>
          ))}
          <span className="text-[10px] text-[var(--theme-text-secondary)] ml-auto capitalize">
            {habit.category}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
