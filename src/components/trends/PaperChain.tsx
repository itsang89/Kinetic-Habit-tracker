'use client';

import { motion } from 'framer-motion';
import { Link2, Maximize2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useRef, useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

type PaperChainData = { date: string; complete: boolean; partial: boolean; completionRate: number };

import { useMounted } from '@/hooks/useMounted';

export default function PaperChain() {
  const { getPaperChainData, habits } = useKineticStore();
  const mounted = useMounted();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chainLength, setChainLength] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const chainData = mounted ? getPaperChainData(30) : [];
  const fullChainData = mounted ? getPaperChainData(90) : []; // 90 days for full view

  // Calculate current chain length (consecutive complete days from today backwards)
  useEffect(() => {
    let length = 0;
    for (let i = chainData.length - 1; i >= 0; i--) {
      const day = chainData[i];
      if (day && day.complete) {
        length++;
      } else {
        break;
      }
    }
    setChainLength(length);
  }, [chainData]);

  // Auto-scroll to the end (most recent)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Consistency Chain</h3>
        </div>
        <p className="text-neutral-500 text-sm text-center py-8">
          Add habits to see your consistency chain
        </p>
      </motion.div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Consistency Chain</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{chainLength}</span>
          <span className="text-xs text-neutral-500 uppercase tracking-wider">day streak</span>
        </div>
      </div>

      {/* Chain visualization */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center gap-1 min-w-max px-2">
          {chainData.map((day, index) => {
            const isToday = index === chainData.length - 1;
            const showConnector = index < chainData.length - 1;
            
            return (
              <div key={day.date} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="relative group"
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${day.complete
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : day.partial
                          ? 'bg-neutral-700 text-neutral-300 border-2 border-dashed border-neutral-500'
                          : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                      }
                      ${isToday ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black' : ''}
                    `}
                  >
                    {day.complete ? (
                      <span className="text-xs font-bold">{Math.round(day.completionRate)}</span>
                    ) : day.partial ? (
                      <span className="text-xs font-medium">{Math.round(day.completionRate)}</span>
                    ) : (
                      <span className="text-lg">×</span>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-black border border-white/20 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                      <p className="text-white font-medium">{formatDate(day.date)}</p>
                      <p className="text-neutral-400">{Math.round(day.completionRate)}% complete</p>
                    </div>
                  </div>
                </motion.div>

                {/* Connector */}
                {showConnector && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.02 + 0.1, duration: 0.2 }}
                    className={`
                      w-4 h-1 origin-left
                      ${day.complete && chainData[index + 1]?.complete
                        ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                        : day.complete || chainData[index + 1]?.complete
                          ? 'bg-neutral-600'
                          : 'bg-neutral-800 border-t border-dashed border-neutral-700'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend + Show All */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neutral-700 border border-dashed border-neutral-500" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-800" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Missed</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-foreground)]/5 hover:bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all text-xs font-bold uppercase tracking-wider"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full History</span>
        </motion.button>
      </div>

      {/* Full History Modal */}
      <TrendDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Consistency Chain"
        subtitle="90-day habit completion history"
      >
        <FullChainHistory data={fullChainData} />
      </TrendDetailModal>
    </motion.div>
  );
}

// Separate component for full history view
function FullChainHistory({ data }: { data: PaperChainData[] }) {
  // Calculate stats
  const completeDays = data.filter(d => d.complete).length;
  const partialDays = data.filter(d => d.partial).length;
  const missedDays = data.filter(d => !d.complete && !d.partial).length;
  const avgCompletion = data.reduce((sum, d) => sum + d.completionRate, 0) / data.length;
  
  // Calculate longest streak
  let longestStreak = 0;
  let currentStreak = 0;
  data.forEach(day => {
    if (day.complete) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  // Weekly breakdown
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Prepare chart data
  const chartData = data.map(d => ({
    date: d.date,
    rate: d.completionRate,
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatWeekDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-white">{completeDays}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Complete Days</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-neutral-400">{partialDays}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Partial Days</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-neutral-600">{missedDays}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Missed Days</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-white">{Math.round(avgCompletion)}%</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Avg Completion</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-white">{longestStreak}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Best Streak</p>
        </div>
      </div>

      {/* Completion Rate Chart */}
      <div>
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Completion Rate Over Time</h3>
        <div className="h-[200px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fontSize: 10, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="rgba(255,255,255,0.2)"
                tick={{ fontSize: 10, fill: '#737373' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#000', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
                labelFormatter={formatDate}
                formatter={(value: number | undefined) => [`${Math.round(value ?? 0)}%`, 'Completion']}
              />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="#fff" 
                fill="rgba(255,255,255,0.1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Weekly Breakdown</h3>
        <div className="space-y-3">
          {weeks.map((week, weekIndex) => {
            const dayValue = weeks[weekIndex];
            if (!dayValue) return null;
            const weekAvg = dayValue.reduce((sum, d) => sum + d.completionRate, 0) / dayValue.length;
            const prevWeek = weeks[weekIndex - 1];
            const prevWeekAvg = weekIndex > 0 && prevWeek
              ? prevWeek.reduce((sum, d) => sum + d.completionRate, 0) / prevWeek.length 
              : weekAvg;
            const trend = weekAvg - prevWeekAvg;

            return (
              <div key={weekIndex} className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500">
                      Week {weeks.length - weekIndex}: {formatWeekDate(week[0]?.date || '')}
                    </span>
                    {weekIndex > 0 && (
                      <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-neutral-500'}`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(Math.round(trend))}%
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{Math.round(weekAvg)}%</span>
                </div>
                <div className="flex gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`
                        flex-1 h-8 rounded-md flex items-center justify-center text-xs font-medium
                        ${day.complete 
                          ? 'bg-white text-black' 
                          : day.partial 
                          ? 'bg-neutral-700 text-neutral-300' 
                          : 'bg-neutral-900 text-neutral-600'
                        }
                      `}
                      title={`${formatDate(day.date)}: ${Math.round(day.completionRate)}%`}
                    >
                      {Math.round(day.completionRate)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

