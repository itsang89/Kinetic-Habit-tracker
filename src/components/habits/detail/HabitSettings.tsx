import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, Bell, Archive, Trash2 } from 'lucide-react';
import { Habit } from '@/store/useKineticStore';

interface HabitSettingsProps {
  habit: Habit;
  showSettings: boolean;
  onToggleSettings: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function HabitSettings({
  habit, showSettings, onToggleSettings, onEdit, onArchive, onDelete
}: HabitSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass p-6 rounded-2xl"
    >
      <button
        onClick={onToggleSettings}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[var(--theme-text-secondary)]" />
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Settings</h3>
        </div>
        <ChevronRight className={`w-4 h-4 text-[var(--theme-text-muted)] transition-transform ${showSettings ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--theme-border)]">
                <div>
                  <p className="text-[var(--theme-text-primary)] text-sm font-medium">Schedule</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">{habit.schedule.join(', ')}</p>
                </div>
                <button 
                  onClick={onEdit}
                  className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-[var(--theme-text-muted)]" />
                  <div>
                    <p className="text-[var(--theme-text-primary)] text-sm font-medium">Reminders</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Not set</p>
                  </div>
                </div>
                <button className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
                  Set up
                </button>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={onArchive}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span className="text-sm font-medium">Pause Habit</span>
                </button>
                <button
                  onClick={onDelete}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete Habit</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
