import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Habit } from '@/store/useKineticStore';

interface HistoryEntry {
  id: string;
  formattedDate: string;
  formattedTime: string;
  value: number;
  mood: number | null;
}

interface HabitHistoryProps {
  habit: Habit;
  historyLog: HistoryEntry[];
}

export default function HabitHistory({ habit, historyLog }: HabitHistoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass p-6 rounded-2xl mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Activity Log</h3>
        <span className="text-xs text-[var(--theme-text-muted)]">{historyLog.length} entries</span>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {historyLog.length === 0 ? (
          <p className="text-[var(--theme-text-secondary)] text-sm text-center py-8">No activity yet</p>
        ) : (
          historyLog.map((log) => (
            <div key={log.id} className="flex items-center gap-4 py-3 border-b border-[var(--theme-border)] last:border-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-[var(--theme-text-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--theme-text-primary)] text-sm font-medium">{log.formattedDate}</p>
                <p className="text-[var(--theme-text-secondary)] text-xs">{log.formattedTime}</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--theme-text-primary)] text-sm font-medium">{log.value} {habit.unit}</p>
                {log.mood && (
                  <p className="text-xs text-[var(--theme-text-secondary)]">Mood: {log.mood}/10</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
