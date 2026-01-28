'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Star, TrendingUp, TrendingDown, Minus, Award, Expand, CheckCircle } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState, useMemo } from 'react';
import TrendDetailModal from './TrendDetailModal';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

import { useMounted } from '@/hooks/useMounted';

export default function WeeklyWrapCard() {
  const { getWeeklySummary, habits, habitLogs, moodLogs } = useKineticStore();
  const mounted = useMounted();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summary = mounted ? getWeeklySummary() : { topHabit: null, totalCompletions: 0, completionRate: 0, momentumChange: 0, avgMood: null };

  // Get weekly data for detailed view
  const weeklyData = useMemo(() => {
    if (!mounted) return [];
    
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0] || '';
      const dayLogs = habitLogs.filter(l => l.completedAt.startsWith(dateString));
      const moodLog = moodLogs.find(m => m.loggedAt.startsWith(dateString));
      
      days.push({
        date: dateString,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDay: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        completions: dayLogs.length,
        mood: moodLog?.score || null,
      });
    }
    return days;
  }, [mounted, habitLogs, moodLogs]);

  // Get habit performance this week
  const habitPerformance = useMemo(() => {
    if (!mounted) return [];
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return habits.filter(h => !h.isArchived).map(habit => {
      const logs = habitLogs.filter(l => 
        l.habitId === habit.id && new Date(l.completedAt) >= weekAgo
      );
      return {
        ...habit,
        weeklyCompletions: logs.length,
      };
    }).sort((a, b) => b.weeklyCompletions - a.weeklyCompletions);
  }, [mounted, habits, habitLogs]);

  const getMomentumIcon = () => {
    if (summary.momentumChange > 0) return TrendingUp;
    if (summary.momentumChange < 0) return TrendingDown;
    return Minus;
  };

  const MomentumIcon = getMomentumIcon();

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 h-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Weekly Wrap</h3>
        </div>
        <p className="text-[var(--theme-text-secondary)] text-sm text-center py-8">
          Add habits to see your weekly summary
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
            <CalendarDays className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">This Week</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          <span className="font-semibold">Full Wrap</span>
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {/* Top Habit */}
        {summary.topHabit && (
          <div className="p-4 bg-[var(--theme-foreground)]/10 rounded-xl border border-[var(--theme-foreground)]/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[var(--theme-text-primary)]" fill="currentColor" />
              <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Top Habit</span>
            </div>
            <p className="text-[var(--theme-text-primary)] font-semibold">{summary.topHabit.name}</p>
            <p className="text-[var(--theme-text-secondary)] text-sm mt-1">
              {summary.topHabit.completions} completions this week
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completion Rate */}
          <div className="p-3 bg-[var(--theme-foreground)]/5 rounded-xl border border-[var(--theme-border)]">
            <div className="flex items-center gap-1 mb-1">
              <Award className="w-3 h-3 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Rate</span>
            </div>
            <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{Math.round(summary.completionRate)}%</p>
          </div>

          {/* Momentum Change */}
          <div className="p-3 bg-[var(--theme-foreground)]/5 rounded-xl border border-[var(--theme-border)]">
            <div className="flex items-center gap-1 mb-1">
              <MomentumIcon className="w-3 h-3 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Momentum</span>
            </div>
            <p className={`text-2xl font-bold ${
              summary.momentumChange > 0 ? 'text-[var(--theme-text-primary)]' : 
              summary.momentumChange < 0 ? 'text-[var(--theme-text-muted)]' : 'text-[var(--theme-text-secondary)]'
            }`}>
              {summary.momentumChange > 0 ? '+' : ''}{summary.momentumChange}
            </p>
          </div>
        </div>

        {/* Average Mood */}
        {summary.avgMood !== null && (
          <div className="flex items-center justify-between p-3 bg-[var(--theme-foreground)]/5 rounded-xl border border-[var(--theme-border)]">
            <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Avg Mood</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--theme-text-primary)]">{summary.avgMood.toFixed(1)}</span>
              <span className="text-[var(--theme-text-secondary)]">/10</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[var(--theme-border)]">
        <p className="text-[10px] text-[var(--theme-text-muted)] text-center uppercase tracking-wider">
          {summary.totalCompletions} total completions
        </p>
      </div>

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Weekly Summary Report"
        subtitle="Detailed breakdown of your week"
      >
        <div className="space-y-8">
          {/* Daily Activity Chart */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Daily Activity
            </h4>
            <div className="h-48 min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--theme-background)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number | undefined) => [value ?? 0, 'Completions']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="completions" fill="var(--theme-foreground)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day by Day Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Day by Day
            </h4>
            <div className="space-y-2">
              {weeklyData.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]"
                >
                  <div className="w-20">
                    <p className="text-[var(--theme-text-primary)] font-medium">{day.day}</p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{day.fullDay.split(',')[0]}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-[var(--theme-foreground)]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((day.completions / Math.max(...weeklyData.map(d => d.completions), 1)) * 100, 100)}%` }}
                        className="h-full bg-[var(--theme-foreground)] rounded-full"
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-[var(--theme-text-primary)] font-bold">{day.completions}</span>
                    <span className="text-[var(--theme-text-secondary)] text-sm ml-1">done</span>
                  </div>
                  {day.mood && (
                    <div className="w-12 text-right">
                      <span className="text-[var(--theme-text-secondary)]">{day.mood}/10</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Habit Leaderboard */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              This Week's Leaderboard
            </h4>
            <div className="space-y-2">
              {habitPerformance.slice(0, 5).map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-3 rounded-xl border ${
                    index === 0 ? 'bg-[var(--theme-foreground)]/10 border-[var(--theme-foreground)]/20' : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-primary)]'
                  }`}>
                    {index === 0 ? <Star className="w-4 h-4" fill="currentColor" /> : <span className="font-bold">{index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--theme-text-primary)] font-medium truncate">{habit.name}</p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{habit.weeklyCompletions} this week</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(habit.weeklyCompletions, 7) }).map((_, i) => (
                      <CheckCircle key={i} className="w-3 h-3 text-[var(--theme-text-primary)]" fill="currentColor" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Weekly Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[var(--theme-border)]">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{summary.totalCompletions}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Total Done</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{Math.round(summary.completionRate)}%</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Success Rate</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${summary.momentumChange >= 0 ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'}`}>
                {summary.momentumChange >= 0 ? '+' : ''}{summary.momentumChange}
              </p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Momentum</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{summary.avgMood?.toFixed(1) || '-'}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Avg Mood</p>
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}
