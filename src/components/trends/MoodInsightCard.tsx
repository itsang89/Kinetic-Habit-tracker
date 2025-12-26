'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Brain, Expand, Smile, Frown, Meh } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, ScatterChart, Scatter, ZAxis, ResponsiveContainer } from 'recharts';
import TrendDetailModal from './TrendDetailModal';
import ChartContainer from '@/components/ui/ChartContainer';

export default function MoodInsightCard() {
  const { getMoodHabitInsight, moodLogs, habits, habitLogs } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const insight = mounted ? getMoodHabitInsight() : null;

  // Extended mood data for modal (last 30 days)
  const extendedMoodData = useMemo(() => {
    if (!mounted) return [];
    
    const data: { date: string; mood: number | null; label: string; fullDate: string; completions: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const log = moodLogs.find(m => m.loggedAt.startsWith(dateString));
      const dayCompletions = habitLogs.filter(l => l.completedAt.startsWith(dateString)).length;
      
      data.push({
        date: dateString,
        mood: log?.score || null,
        label: date.toLocaleDateString('en-US', { day: 'numeric' }),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completions: dayCompletions,
      });
    }
    return data;
  }, [mounted, moodLogs, habitLogs]);

  // Mood distribution
  const moodDistribution = useMemo(() => {
    if (!mounted) return [];
    const distribution = Array(10).fill(0);
    moodLogs.forEach(log => {
      if (log.score >= 1 && log.score <= 10) {
        distribution[log.score - 1]++;
      }
    });
    return distribution.map((count, i) => ({ score: i + 1, count }));
  }, [mounted, moodLogs]);

  // Prepare mood chart data (last 14 days)
  const moodChartData = useMemo(() => {
    if (!mounted) return [];
    
    const last14Days: { date: string; mood: number | null; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const log = moodLogs.find(m => m.loggedAt.startsWith(dateString));
      
      last14Days.push({
        date: dateString,
        mood: log?.score || null,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return last14Days;
  }, [mounted, moodLogs]);

  // Calculate mood stats
  const moodStats = useMemo(() => {
    const validMoods = moodChartData.filter(d => d.mood !== null).map(d => d.mood as number);
    if (validMoods.length === 0) return { avg: 0, trend: 0, high: 0, low: 0 };
    
    const avg = validMoods.reduce((a, b) => a + b, 0) / validMoods.length;
    const high = Math.max(...validMoods);
    const low = Math.min(...validMoods);
    
    // Calculate trend (last 7 vs previous 7)
    const recent = moodChartData.slice(-7).filter(d => d.mood !== null).map(d => d.mood as number);
    const older = moodChartData.slice(0, 7).filter(d => d.mood !== null).map(d => d.mood as number);
    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;
    const trend = recentAvg - olderAvg;
    
    return { avg, trend, high, low };
  }, [moodChartData]);

  if (!mounted || habits.length === 0 || moodLogs.length < 7) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 h-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Mood Insight</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <Sparkles className="w-8 h-8 text-[var(--theme-text-quaternary)] mb-3" />
          <p className="text-[var(--theme-text-tertiary)] text-sm text-center">
            {moodLogs.length < 7 
              ? `Log ${7 - moodLogs.length} more days to unlock insights` 
              : 'Add habits to discover mood correlations'}
          </p>
        </div>
      </motion.div>
    );
  }

  const isPositive = insight && insight.moodDelta > 0;
  const trendPositive = moodStats.trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center"
          >
            <Brain className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </motion.div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Mood Trends</h3>
        </div>
        {/* Trend indicator + Show All */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs ${trendPositive ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-tertiary)]'}`}>
            {trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trendPositive ? '+' : ''}{moodStats.trend.toFixed(1)}</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
          >
            <span className="font-semibold">Full Stats</span>
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mood Chart */}
      <ChartContainer className="h-[100px] mb-4" minHeight={100}>
        <AreaChart data={moodChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--theme-foreground)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--theme-foreground)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="label" 
            stroke="var(--theme-border)"
            tick={{ fontSize: 9, fill: 'var(--theme-text-quaternary)' }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis 
            domain={[1, 10]}
            stroke="var(--theme-border)"
            tick={{ fontSize: 9, fill: 'var(--theme-text-quaternary)' }}
            axisLine={false}
            tickLine={false}
            ticks={[1, 5, 10]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--theme-background)', 
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--theme-text-primary)'
            }}
            formatter={(value: number | undefined) => [value ? `${value}/10` : 'No data', 'Mood']}
            labelFormatter={(label) => label}
          />
          <ReferenceLine y={moodStats.avg} stroke="var(--theme-text-tertiary)" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey="mood" 
            stroke="var(--theme-foreground)" 
            fill="url(#moodGradient)"
            strokeWidth={2}
            dot={{ fill: 'var(--theme-background)', stroke: 'var(--theme-foreground)', strokeWidth: 2, r: 3 }}
            connectNulls
          />
        </AreaChart>
      </ChartContainer>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-[var(--theme-border)]">
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--theme-text-primary)]">{moodStats.avg.toFixed(1)}</p>
          <p className="text-[9px] text-[var(--theme-text-tertiary)] uppercase">Average</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--theme-text-primary)]">{moodStats.high}</p>
          <p className="text-[9px] text-[var(--theme-text-tertiary)] uppercase">High</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--theme-text-tertiary)]">{moodStats.low}</p>
          <p className="text-[9px] text-[var(--theme-text-tertiary)] uppercase">Low</p>
        </div>
      </div>

      {/* Key Insight */}
      {insight && (
        <div className="flex items-start gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${isPositive ? 'bg-[var(--theme-foreground)]/10' : 'bg-[var(--theme-dark)]'}
          `}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-[var(--theme-text-primary)]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-[var(--theme-text-tertiary)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed line-clamp-2">
              {insight.message}
            </p>
            <p className="text-[10px] text-[var(--theme-text-tertiary)] mt-1">
              Key habit: <span className="text-[var(--theme-text-primary)]">{insight.habit}</span>
            </p>
          </div>
        </div>
      )}

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Mood Analysis"
        subtitle="30-day mood trends and correlations"
      >
        <div className="space-y-8">
          {/* 30-Day Mood Chart */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              30-Day Mood History
            </h4>
            <div className="h-64 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <AreaChart data={extendedMoodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGradientFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-foreground)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--theme-foreground)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    domain={[1, 10]}
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[1, 5, 10]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--theme-background)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--theme-text-primary)'
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [value ? `${value}/10` : 'No data', name === 'mood' ? 'Mood' : (name ?? '')]}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                  />
                  <ReferenceLine y={moodStats.avg} stroke="var(--theme-text-tertiary)" strokeDasharray="3 3" label={{ value: 'Avg', fill: 'var(--theme-text-tertiary)', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--theme-foreground)"
                    fill="url(#moodGradientFull)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--theme-background)', stroke: 'var(--theme-foreground)', strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Distribution */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Mood Distribution
            </h4>
            <div className="grid grid-cols-10 gap-1">
              {moodDistribution.map((item, index) => {
                const maxCount = Math.max(...moodDistribution.map(d => d.count), 1);
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={item.score} className="flex flex-col items-center">
                    <div className="w-full h-24 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.05 }}
                        className={`w-full rounded-t ${item.score <= 3 ? 'bg-[var(--theme-text-quaternary)]' : item.score <= 6 ? 'bg-[var(--theme-text-secondary)]' : 'bg-[var(--theme-foreground)]'}`}
                      />
                    </div>
                    <div className="mt-2 flex flex-col items-center">
                      {item.score === 1 && <Frown className="w-4 h-4 text-[var(--theme-text-tertiary)]" />}
                      {item.score === 5 && <Meh className="w-4 h-4 text-[var(--theme-text-secondary)]" />}
                      {item.score === 10 && <Smile className="w-4 h-4 text-[var(--theme-text-primary)]" />}
                      <span className="text-[10px] text-[var(--theme-text-tertiary)] mt-1">{item.score}</span>
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-quaternary)]">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood vs Completions Scatter */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              Mood vs. Habit Completions
            </h4>
            <div className="h-48 min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis
                    dataKey="completions"
                    name="Completions"
                    type="number"
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Habit Completions', position: 'bottom', fill: 'var(--theme-text-quaternary)', fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="mood"
                    name="Mood"
                    type="number"
                    domain={[1, 10]}
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Mood Score', angle: -90, position: 'insideLeft', fill: 'var(--theme-text-quaternary)', fontSize: 10 }}
                  />
                  <ZAxis range={[50, 50]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--theme-background)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--theme-text-primary)'
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, name ?? '']}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                  />
                  <Scatter
                    data={extendedMoodData.filter(d => d.mood !== null)}
                    fill="var(--theme-foreground)"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-[var(--theme-text-tertiary)] text-center mt-2">
              Each dot represents a day - see how completions relate to mood
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[var(--theme-border)]">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{moodStats.avg.toFixed(1)}</p>
              <p className="text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wider">Average</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{moodStats.high}</p>
              <p className="text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wider">Highest</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--theme-text-tertiary)]">{moodStats.low}</p>
              <p className="text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wider">Lowest</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${moodStats.trend >= 0 ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-tertiary)]'}`}>
                {moodStats.trend >= 0 ? '+' : ''}{moodStats.trend.toFixed(1)}
              </p>
              <p className="text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wider">Trend</p>
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}

