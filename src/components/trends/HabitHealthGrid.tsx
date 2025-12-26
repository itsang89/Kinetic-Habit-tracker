'use client';

import { motion } from 'framer-motion';
import { HeartPulse, AlertCircle, CheckCircle, Expand, TrendingUp, TrendingDown } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';

const getHealthStatus = (health: number): { label: string; color: string; bgColor: string } => {
  if (health >= 80) return { label: 'Strong', color: 'text-[var(--theme-text-primary)]', bgColor: 'bg-[var(--theme-foreground)]' };
  if (health >= 50) return { label: 'Good', color: 'text-[var(--theme-text-primary)]/80', bgColor: 'bg-[var(--theme-foreground)]/60' };
  if (health >= 25) return { label: 'At Risk', color: 'text-[var(--theme-text-secondary)]', bgColor: 'bg-[var(--theme-foreground)]/40' };
  return { label: 'Critical', color: 'text-[var(--theme-text-muted)]', bgColor: 'bg-[var(--theme-foreground)]/20' };
};

export default function HabitHealthGrid() {
  const { habits, getHabitHealth } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const habitsWithHealth = mounted 
    ? habits
        .filter(h => !h.isArchived)
        .map(habit => ({
          ...habit,
          health: getHabitHealth(habit.id),
        })).sort((a, b) => a.health - b.health)
    : [];

  const criticalCount = habitsWithHealth.filter(h => h.health < 50).length;
  const healthyCount = habitsWithHealth.filter(h => h.health >= 80).length;
  const avgHealth = habitsWithHealth.length > 0 
    ? Math.round(habitsWithHealth.reduce((sum, h) => sum + h.health, 0) / habitsWithHealth.length)
    : 0;

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 h-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Habit Health</h3>
        </div>
        <p className="text-[var(--theme-text-secondary)] text-sm text-center py-8">
          Add habits to monitor their health
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
            <HeartPulse className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Habit Health</h3>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[var(--theme-foreground)]/10 rounded-full">
              <AlertCircle className="w-3 h-3 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">{criticalCount}</span>
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
          >
            <span className="font-semibold">All Health</span>
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {habitsWithHealth.map((habit, index) => {
          const status = getHealthStatus(habit.health);
          
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-[var(--theme-foreground)]/5 rounded-xl border border-[var(--theme-border)]"
            >
              {/* Battery indicator */}
              <div className="relative w-8 h-14 rounded-lg bg-[var(--theme-foreground)]/10 border-2 border-[var(--theme-border)] overflow-hidden">
                {/* Battery top */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-[var(--theme-foreground)]/20 rounded-t" />
                
                {/* Fill level */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${habit.health}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className={`absolute bottom-0 left-0 right-0 ${status.bgColor}`}
                  style={{
                    boxShadow: habit.health >= 80 ? '0 0 10px var(--theme-glow)' : 'none'
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[var(--theme-text-primary)] font-medium text-sm truncate">{habit.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-[var(--theme-text-muted)] text-xs">•</span>
                  <span className="text-[var(--theme-text-secondary)] text-xs">{habit.health}%</span>
                </div>
              </div>

              {/* Status icon */}
              {habit.health >= 80 ? (
                <CheckCircle className="w-5 h-5 text-[var(--theme-text-primary)] shrink-0" />
              ) : habit.health < 50 ? (
                <AlertCircle className="w-5 h-5 text-[var(--theme-text-muted)] shrink-0" />
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--theme-border)]">
        <div className="flex justify-between text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">
          <span>Based on last 7 days</span>
          <span>Weighted by recency</span>
        </div>
      </div>

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Complete Habit Health Report"
        subtitle="7-day performance analysis for all habits"
      >
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/10 border border-[var(--theme-foreground)]/20 text-center">
              <p className="text-4xl font-bold text-[var(--theme-text-primary)]">{avgHealth}%</p>
              <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mt-1">Average Health</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-center">
              <p className="text-4xl font-bold text-[var(--theme-text-primary)]">{healthyCount}</p>
              <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mt-1">Strong Habits</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-center">
              <p className="text-4xl font-bold text-[var(--theme-text-secondary)]">{criticalCount}</p>
              <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mt-1">Need Attention</p>
            </div>
          </div>

          {/* All Habits List */}
          <div className="space-y-3">
            {habitsWithHealth.map((habit, index) => {
              const status = getHealthStatus(habit.health);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]"
                >
                  <div className="flex items-center gap-4">
                    {/* Large Battery */}
                    <div className="relative w-10 h-16 rounded-lg bg-[var(--theme-foreground)]/10 border-2 border-[var(--theme-border)] overflow-hidden flex-shrink-0">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[var(--theme-foreground)]/20 rounded-t" />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${habit.health}%` }}
                        transition={{ duration: 0.5, delay: index * 0.03 }}
                        className={`absolute bottom-0 left-0 right-0 ${status.bgColor}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[var(--theme-text-primary)] font-semibold truncate">{habit.name}</p>
                        {habit.health >= 80 && <TrendingUp className="w-4 h-4 text-[var(--theme-text-primary)] flex-shrink-0" />}
                        {habit.health < 50 && <TrendingDown className="w-4 h-4 text-[var(--theme-text-muted)] flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-[var(--theme-text-muted)] text-sm">•</span>
                        <span className="text-[var(--theme-text-secondary)] text-sm">{habit.health}%</span>
                        <span className="text-[var(--theme-text-muted)] text-sm">•</span>
                        <span className="text-[var(--theme-text-secondary)] text-sm">{habit.streak} day streak</span>
                      </div>
                    </div>

                    {/* Health Score Circle */}
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center
                      ${habit.health >= 80 ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 
                        habit.health >= 50 ? 'bg-[var(--theme-foreground)]/30 text-[var(--theme-text-primary)]' : 
                        'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)]'}
                    `}>
                      <span className="text-lg font-bold">{habit.health}</span>
                    </div>
                  </div>

                  {/* Detailed Bar */}
                  <div className="mt-3 pt-3 border-t border-[var(--theme-border)]">
                    <div className="h-2 bg-[var(--theme-foreground)]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${habit.health}%` }}
                        transition={{ duration: 0.5, delay: index * 0.03 }}
                        className={`h-full ${status.bgColor} rounded-full`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Health Legend */}
          <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]">
            <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mb-3">Health Score Guide</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Strong', range: '80-100%', color: 'bg-[var(--theme-foreground)]' },
                { label: 'Good', range: '50-79%', color: 'bg-[var(--theme-foreground)]/60' },
                { label: 'At Risk', range: '25-49%', color: 'bg-[var(--theme-foreground)]/40' },
                { label: 'Critical', range: '0-24%', color: 'bg-[var(--theme-foreground)]/20' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <div>
                    <p className="text-xs text-[var(--theme-text-primary)] font-medium">{item.label}</p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{item.range}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}
