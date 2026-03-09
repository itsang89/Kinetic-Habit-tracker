'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  Droplet, Book, Brain, Dumbbell, Heart, Sun, Moon, Coffee, 
  Pencil, Code, Music, Leaf, Target, Zap, Star,
  Edit3, Archive, ArchiveRestore, ChevronRight, Copy, MoreVertical
} from 'lucide-react';
import { Habit, HabitIcon, useKineticStore } from '@/store/useKineticStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { HABIT_ICON_MAP } from '@/lib/habitIcons';

interface HabitManagerCardProps {
  habit: Habit;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate?: () => void;
}

function HabitManagerCardComponent({ 
  habit, 
  isSelected, 
  isEditMode, 
  onSelect, 
  onEdit,
  onDuplicate 
}: HabitManagerCardProps) {
  const router = useRouter();
  const { getWeeklyHabitData, archiveHabit, unarchiveHabit, setGlobalModalOpen } = useKineticStore();
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isDragging = useRef(false);

  useEffect(() => {
    if (showArchiveConfirm) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showArchiveConfirm, setGlobalModalOpen]);
  
  const weeklyData = getWeeklyHabitData(habit.id);
  const Icon = HABIT_ICON_MAP[habit.icon] || Star;
  
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['color-mix(in oklab, var(--color-error) 20%, transparent)', 'transparent', 'color-mix(in oklab, var(--color-success) 20%, transparent)']
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
        setShowArchiveConfirm(true);
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

  const handleArchive = async () => {
    await archiveHabit(habit.id);
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
          <ArchiveRestore className="w-6 h-6 text-[var(--color-success)]" />
        ) : (
          <Archive className="w-6 h-6 text-[var(--color-error)]" />
        )}
      </div>
      
      {/* Right action (edit) - long swipe for edit, could add duplicate in context menu */}
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${showActions === 'right' ? 'opacity-100' : 'opacity-0'}`}>
        <Edit3 className="w-6 h-6 text-[var(--color-success)]" />
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
          ${isSelected ? 'ring-2 ring-[var(--brand-main)]' : ''}
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

          {/* Stats & Menu */}
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1 relative">
            {onDuplicate && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-2 rounded-lg hover:bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-1 py-1 glass rounded-xl shadow-lg z-20 min-w-[140px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> Duplicate
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {habit.isArchived ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm(`Unpause "${habit.name}"?`)) {
                    await unarchiveHabit(habit.id);
                  }
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
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Pause Habit?"
        message={`Are you sure you want to pause "${habit.name}"? You can unpause it later.`}
        confirmLabel="Pause"
      />
    </motion.div>
  );
}

export default React.memo(HabitManagerCardComponent);
