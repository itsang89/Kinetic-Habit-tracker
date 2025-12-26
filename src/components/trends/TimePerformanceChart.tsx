'use client';

import { motion } from 'framer-motion';
import { Clock, Sunrise, Sun, Moon, Expand } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
};

const getTimeOfDayIcon = (hour: number) => {
  if (hour >= 5 && hour < 12) return Sunrise;
  if (hour >= 12 && hour < 18) return Sun;
  return Moon;
};

export default function TimePerformanceChart() {
  const { getTimeOfDayPerformance, habitLogs, habits } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const performance = mounted ? getTimeOfDayPerformance() : [];

  // Find peak hour
  const peakHour = performance.reduce((peak, current) => {
    if (current.count > (peak?.count || 0)) return current;
    return peak;
  }, null as typeof performance[0] | null);

  const totalCompletions = performance.reduce((sum, p) => sum + p.count, 0);

  // Format data for chart
  const chartData = performance.map(p => ({
    hour: p.hour,
    label: formatHour(p.hour),
    count: p.count,
  }));

  if (!mounted || habitLogs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Peak Hours</h3>
        </div>
        <p className="text-[var(--theme-text-tertiary)] text-sm text-center py-8">
          Complete habits to discover your peak hours
        </p>
      </motion.div>
    );
  }

  const PeakIcon = peakHour ? getTimeOfDayIcon(peakHour.hour) : Clock;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--theme-background)] border border-[var(--theme-border)] p-3 rounded-xl">
          <p className="text-[var(--theme-text-primary)] font-medium">{formatHour(data.hour)}</p>
          <p className="text-[var(--theme-text-secondary)] text-sm">{data.count} completions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Peak Hours</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {peakHour && peakHour.count > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-foreground)]/10 rounded-full">
              <PeakIcon className="w-4 h-4 text-[var(--theme-text-primary)]" />
              <span className="text-[var(--theme-text-primary)] text-sm font-medium">{formatHour(peakHour.hour)}</span>
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
          >
            <span className="font-semibold">Full Breakdown</span>
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 min-h-[192px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--theme-foreground)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--theme-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tickFormatter={(h) => h % 6 === 0 ? formatHour(h) : ''}
              stroke="var(--theme-border)"
              tick={{ fontSize: 10, fill: 'var(--theme-text-quaternary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="var(--theme-border)"
              tick={{ fontSize: 10, fill: 'var(--theme-text-quaternary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--theme-foreground)"
              strokeWidth={2}
              fill="url(#timeGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {peakHour && peakHour.count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-[var(--theme-border)]"
        >
          <p className="text-[var(--theme-text-secondary)] text-sm text-center">
            You're most productive at{' '}
            <span className="text-[var(--theme-text-primary)] font-medium">{formatHour(peakHour.hour)}</span>
            {' '}with {Math.round((peakHour.count / totalCompletions) * 100)}% of completions
          </p>
        </motion.div>
      )}

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Time Performance Analysis"
        subtitle="Detailed breakdown of your productive hours"
      >
        <div className="space-y-8">
          {/* Full Bar Chart */}
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => formatHour(h)}
                  stroke="var(--theme-border)"
                  tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--theme-border)"
                  tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--theme-foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time Blocks */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Performance by Time Block
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Morning', icon: Sunrise, range: [5, 12], color: 'text-[var(--theme-text-primary)]' },
                { label: 'Afternoon', icon: Sun, range: [12, 18], color: 'text-[var(--theme-text-secondary)]' },
                { label: 'Evening', icon: Moon, range: [18, 24], color: 'text-[var(--theme-text-tertiary)]' },
              ].map(block => {
                const blockCount = performance
                  .filter(p => p.hour >= block.range[0] && p.hour < block.range[1])
                  .reduce((sum, p) => sum + p.count, 0);
                const percentage = totalCompletions > 0 ? Math.round((blockCount / totalCompletions) * 100) : 0;
                const Icon = block.icon;
                
                return (
                  <div key={block.label} className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${block.color}`} />
                      <span className="text-[var(--theme-text-primary)] font-medium">{block.label}</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--theme-text-primary)] mb-1">{percentage}%</p>
                    <p className="text-xs text-[var(--theme-text-tertiary)]">{blockCount} completions</p>
                    <div className="mt-3 h-2 bg-[var(--theme-dark)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-[var(--theme-foreground)] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hour by Hour Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Hourly Breakdown
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {performance.map(p => {
                const isPeak = peakHour && p.hour === peakHour.hour;
                return (
                  <div
                    key={p.hour}
                    className={`p-2 rounded-lg text-center ${isPeak ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'bg-[var(--theme-foreground)]/5'}`}
                  >
                    <p className={`text-xs font-medium ${isPeak ? 'text-[var(--theme-background)]' : 'text-[var(--theme-text-secondary)]'}`}>
                      {formatHour(p.hour)}
                    </p>
                    <p className={`text-lg font-bold ${isPeak ? 'text-[var(--theme-background)]' : 'text-[var(--theme-text-primary)]'}`}>
                      {p.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}

