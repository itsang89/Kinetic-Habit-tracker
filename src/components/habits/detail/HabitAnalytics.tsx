import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Brain } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Habit } from '@/store/useKineticStore';

interface HabitAnalyticsProps {
  habit: Habit;
  scoreTrend: any[];
  timeAnalysis: any[];
  peakTime: string;
  successRate: number;
  completedDays: number;
  scheduledDays: number;
}

export default function HabitAnalytics({ 
  habit, scoreTrend, timeAnalysis, peakTime, 
  successRate, completedDays, scheduledDays 
}: HabitAnalyticsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Score Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--theme-text-primary)]" />
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Momentum Trend</h3>
          </div>
          <div className="h-[120px] min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={80}>
              <LineChart data={scoreTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-background)', border: '1px solid var(--theme-border)', borderRadius: '8px' }}
                  formatter={(value: number | undefined) => [`${value ?? ''}`, 'Score']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--theme-foreground)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-2">Last 3 months</p>
        </motion.div>

        {/* Time Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[var(--theme-text-primary)]" />
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Peak Time</h3>
          </div>
          <div className="h-[120px] min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={80}>
              <BarChart data={timeAnalysis} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 9, fill: 'var(--theme-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-background)', border: '1px solid var(--theme-border)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {timeAnalysis.map((entry, index) => (
                    <Cell key={index} fill={entry.label === peakTime ? 'var(--theme-foreground)' : 'var(--theme-text-muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-2">
            You usually complete this at <span className="text-[var(--theme-text-primary)] font-medium">{peakTime || 'various times'}</span>
          </p>
        </motion.div>
      </div>

      {/* Correlation Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-6 rounded-2xl mb-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--theme-foreground)]/10 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-[var(--theme-text-primary)]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-2">Insight</h3>
            <p className="text-[var(--theme-text-primary)] text-sm leading-relaxed">
              {successRate >= 80 
                ? `Great consistency! You've completed ${habit.name} on ${completedDays} of the last ${scheduledDays} scheduled days.`
                : successRate >= 50
                  ? `You're building momentum. Focus on ${habit.schedule.slice(0, 2).join(' and ')} to improve your streak.`
                  : `This habit needs attention. Try scheduling it at a consistent time each day.`
              }
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
