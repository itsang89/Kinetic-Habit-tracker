'use client';

import { motion } from 'framer-motion';
import { Flame, Target, Expand, Trophy } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';

import { useMounted } from '@/hooks/useMounted';

export default function StreakComparison() {
  const { habits } = useKineticStore();
  const mounted = useMounted();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Find habit with highest current streak
  const topHabit = habits.reduce((best, habit) => {
    if (!best || habit.streak > best.streak) return habit;
    return best;
  }, null as typeof habits[0] | null);

  const currentStreak = topHabit?.streak || 0;
  const bestStreak = topHabit?.bestStreak || 0;
  const progress = bestStreak > 0 ? (currentStreak / bestStreak) * 100 : 0;
  const daysToRecord = bestStreak - currentStreak;

  // All habits sorted by streak
  const allStreaks = [...habits]
    .filter(h => !h.isArchived)
    .sort((a, b) => b.streak - a.streak);

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 h-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Streak Record</h3>
        </div>
        <p className="text-[var(--theme-text-secondary)] text-sm text-center py-8">
          Start a streak to track your record
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Streak Record</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          <span className="font-semibold">All Records</span>
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Current streak */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-[var(--theme-text-primary)]" fill="currentColor" />
            <span className="text-5xl font-bold text-[var(--theme-text-primary)]">{currentStreak}</span>
          </div>
          <p className="text-[var(--theme-text-secondary)] text-xs uppercase tracking-wider">Current Streak</p>
          {topHabit && (
            <p className="text-[var(--theme-text-secondary)] text-sm mt-1">{topHabit.name}</p>
          )}
        </div>

        {/* Progress bar with ghost marker */}
        <div className="relative mb-4">
          <div className="h-3 bg-[var(--theme-foreground)]/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-[var(--theme-foreground)] rounded-full"
              style={{
                boxShadow: progress > 50 ? '0 0 15px var(--theme-glow)' : 'none'
              }}
            />
          </div>
          
          {/* Ghost marker for best streak */}
          {bestStreak > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-0 h-3 flex items-center"
              style={{ left: '100%', transform: 'translateX(-50%)' }}
            >
              <div className="w-1 h-5 bg-[var(--theme-text-muted)] rounded-full" />
            </motion.div>
          )}
        </div>

        {/* Best streak label */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--theme-text-secondary)]">0</span>
          <div className="flex items-center gap-1">
            <span className="text-[var(--theme-text-secondary)]">Best:</span>
            <span className="text-[var(--theme-text-primary)] font-bold">{bestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mt-6 pt-4 border-t border-[var(--theme-border)] text-center">
        {currentStreak >= bestStreak && currentStreak > 0 ? (
          <p className="text-[var(--theme-text-primary)] text-sm font-medium">
            🎉 New personal record!
          </p>
        ) : daysToRecord > 0 ? (
          <p className="text-[var(--theme-text-secondary)] text-sm">
            <span className="text-[var(--theme-text-primary)] font-bold">{daysToRecord}</span> days to beat your record
          </p>
        ) : (
          <p className="text-[var(--theme-text-secondary)] text-sm">
            Complete habits to build your streak
          </p>
        )}
      </div>

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Habit Streaks"
        subtitle="Current and best streaks for all habits"
      >
        <div className="space-y-4">
          {allStreaks.map((habit, index) => {
            const habitProgress = habit.bestStreak > 0 ? (habit.streak / habit.bestStreak) * 100 : 0;
            const isRecord = habit.streak >= habit.bestStreak && habit.streak > 0;
            
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-foreground)]/5"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-[var(--theme-text-secondary)] font-bold text-lg w-8">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--theme-text-primary)] font-semibold truncate">{habit.name}</p>
                      {isRecord && <Trophy className="w-4 h-4 text-[var(--theme-text-primary)] flex-shrink-0" />}
                    </div>
                    <p className="text-[var(--theme-text-secondary)] text-xs">{habit.schedule.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Flame className="w-5 h-5 text-[var(--theme-text-primary)]" fill={habit.streak > 0 ? 'currentColor' : 'transparent'} />
                      <span className="text-2xl font-bold text-[var(--theme-text-primary)]">{habit.streak}</span>
                    </div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">current</p>
                  </div>
                </div>
                
                {/* Progress bar to best */}
                <div className="relative">
                  <div className="h-2 bg-[var(--theme-foreground)]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(habitProgress, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="h-full bg-[var(--theme-foreground)] rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[var(--theme-text-muted)]">0</span>
                    <span className="text-[10px] text-[var(--theme-text-secondary)]">
                      Best: <span className="text-[var(--theme-text-primary)]">{habit.bestStreak}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {allStreaks.length === 0 && (
            <p className="text-[var(--theme-text-secondary)] text-center py-8">
              No active habits found
            </p>
          )}

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-[var(--theme-border)]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-[var(--theme-text-primary)]">
                  {allStreaks.reduce((sum, h) => sum + h.streak, 0)}
                </p>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Total Days</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--theme-text-primary)]">
                  {Math.max(...allStreaks.map(h => h.streak), 0)}
                </p>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Longest Active</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--theme-text-primary)]">
                  {Math.max(...allStreaks.map(h => h.bestStreak), 0)}
                </p>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">All-Time Best</p>
              </div>
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}
