'use client';

import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, Maximize2, Target, Clock, TrendingUp } from 'lucide-react';
import { useKineticStore, DayOfWeek, Habit, HabitLog } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

type DayEfficiency = { day: DayOfWeek; rate: number; total: number; completed: number };

const dayLabels: { [key in DayOfWeek]: string } = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export default function DayEfficiencyChart() {
  const { getDayOfWeekEfficiency, habits, habitLogs } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const efficiency = mounted ? getDayOfWeekEfficiency() : [];

  // Find worst day
  const worstDay = efficiency.reduce((worst, day) => {
    if (day.total > 0 && (!worst || day.rate < worst.rate)) return day;
    return worst;
  }, null as typeof efficiency[0] | null);

  // Find best day
  const bestDay = efficiency.reduce((best, day) => {
    if (day.total > 0 && (!best || day.rate > best.rate)) return day;
    return best;
  }, null as typeof efficiency[0] | null);

  const maxRate = Math.max(...efficiency.map(d => d.rate), 1);

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Day Efficiency</h3>
        </div>
        <p className="text-[var(--theme-text-tertiary)] text-sm text-center py-8">
          Add habits to see your weekly patterns
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Day Efficiency</h3>
        </div>
        <p className="text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wider">Last 12 weeks</p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-2 h-40 mb-4">
        {efficiency.map((day, index) => {
          const heightPercent = maxRate > 0 ? (day.rate / maxRate) * 100 : 0;
          const isWorst = worstDay && day.day === worstDay.day && day.rate < 70;
          const isBest = bestDay && day.day === bestDay.day;
          
          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-32 flex items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                  className={`
                    w-full max-w-[40px] rounded-t-lg transition-all
                    ${isWorst 
                      ? 'bg-[var(--theme-text-quaternary)]' 
                      : isBest 
                        ? 'bg-[var(--theme-foreground)] shadow-[0_0_15px_var(--theme-glow)]' 
                        : 'bg-[var(--theme-text-secondary)]'
                    }
                  `}
                />
                
                {/* Rate label */}
                <span className={`
                  absolute -top-6 text-xs font-bold
                  ${day.rate === 0 ? 'text-[var(--theme-text-quaternary)]' : isBest ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'}
                `}>
                  {Math.round(day.rate)}%
                </span>
              </div>
              
              {/* Day label */}
              <span className={`
                text-[10px] font-bold uppercase tracking-wider
                ${isWorst ? 'text-[var(--theme-text-tertiary)]' : isBest ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-tertiary)]'}
              `}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insight + Show All */}
      <div className="flex items-center justify-between mt-4">
        {worstDay && worstDay.rate < 70 ? (
          <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
            <AlertTriangle className="w-4 h-4" />
            <span>{dayLabels[worstDay.day]} needs attention ({Math.round(worstDay.rate)}%)</span>
          </div>
        ) : (
          <div />
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-foreground)]/5 hover:bg-[var(--theme-foreground)]/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all text-xs font-bold uppercase tracking-wider"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Analysis</span>
        </motion.button>
      </div>

      {/* Detailed Analysis Modal */}
      <TrendDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Day-by-Day Analysis"
        subtitle="Detailed breakdown of your weekly performance patterns"
      >
        <DayEfficiencyDetail efficiency={efficiency} habits={habits} habitLogs={habitLogs} />
      </TrendDetailModal>
    </motion.div>
  );
}

// Detailed day efficiency component
function DayEfficiencyDetail({ 
  efficiency, 
  habits, 
  habitLogs 
}: { 
  efficiency: DayEfficiency[];
  habits: Habit[];
  habitLogs: HabitLog[];
}) {
  // Calculate overall stats
  const avgRate = efficiency.reduce((sum, d) => sum + d.rate, 0) / efficiency.length;
  const bestDay = efficiency.reduce((best, d) => d.rate > (best?.rate || 0) ? d : best, efficiency[0]);
  const worstDay = efficiency.reduce((worst, d) => d.rate < (worst?.rate || 100) && d.total > 0 ? d : worst, efficiency[0]);
  
  // Weekday vs Weekend analysis
  const weekdayAvg = efficiency
    .filter(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(d.day))
    .reduce((sum, d) => sum + d.rate, 0) / 5;
  const weekendAvg = efficiency
    .filter(d => ['Sat', 'Sun'].includes(d.day))
    .reduce((sum, d) => sum + d.rate, 0) / 2;

  // Radar chart data
  const radarData = efficiency.map(d => ({
    day: d.day,
    rate: d.rate,
    fullMark: 100,
  }));

  // Detailed bar chart data
  const barData = efficiency.map(d => ({
    day: dayLabels[d.day],
    shortDay: d.day,
    rate: Math.round(d.rate),
    completed: d.completed,
    total: d.total,
  }));

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{Math.round(avgRate)}%</p>
          <p className="text-xs text-[var(--theme-text-tertiary)] uppercase tracking-wider mt-1">Overall Average</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{bestDay?.day}</p>
          <p className="text-xs text-[var(--theme-text-tertiary)] uppercase tracking-wider mt-1">Best Day ({Math.round(bestDay?.rate || 0)}%)</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-[var(--theme-text-secondary)]">{worstDay?.day}</p>
          <p className="text-xs text-[var(--theme-text-tertiary)] uppercase tracking-wider mt-1">Needs Work ({Math.round(worstDay?.rate || 0)}%)</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-[var(--theme-text-primary)]">
            {weekdayAvg > weekendAvg ? 'Weekdays' : 'Weekends'}
          </p>
          <p className="text-xs text-[var(--theme-text-tertiary)] uppercase tracking-wider mt-1">Stronger Performance</p>
        </div>
      </div>

      {/* Charts Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div>
          <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-4">Completion Rate by Day</h3>
          <div className="h-[250px] min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <XAxis 
                  dataKey="shortDay" 
                  stroke="var(--theme-border)"
                  tick={{ fontSize: 12, fill: 'var(--theme-text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--theme-border)"
                  tick={{ fontSize: 10, fill: 'var(--theme-text-tertiary)' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--theme-background)', 
                    border: '1px solid var(--theme-border)',
                    borderRadius: '8px',
                    color: 'var(--theme-text-primary)'
                  }}
                  formatter={(value: number | undefined, name: string | undefined, props: { payload?: { completed?: number; total?: number } }) => [
                    `${value ?? 0}% (${props.payload?.completed ?? 0}/${props.payload?.total ?? 0})`,
                    'Completion'
                  ]}
                  labelFormatter={(label) => dayLabels[label as DayOfWeek]}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.rate >= 80 ? 'var(--theme-foreground)' : entry.rate >= 60 ? 'var(--theme-text-secondary)' : 'var(--theme-text-quaternary)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div>
          <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-4">Weekly Pattern</h3>
          <div className="h-[250px] min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--theme-border)" />
                <PolarAngleAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: 'var(--theme-text-tertiary)' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: 'var(--theme-text-quaternary)' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Radar 
                  name="Completion Rate" 
                  dataKey="rate" 
                  stroke="var(--theme-foreground)" 
                  fill="var(--theme-foreground)" 
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekday vs Weekend */}
      <div>
        <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-4">Weekday vs Weekend</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[var(--theme-text-secondary)]">Weekdays</span>
              <span className="text-2xl font-bold text-[var(--theme-text-primary)]">{Math.round(weekdayAvg)}%</span>
            </div>
            <div className="w-full h-3 bg-[var(--theme-dark)] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${weekdayAvg}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[var(--theme-foreground)] rounded-full"
              />
            </div>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[var(--theme-text-secondary)]">Weekends</span>
              <span className="text-2xl font-bold text-[var(--theme-text-primary)]">{Math.round(weekendAvg)}%</span>
            </div>
            <div className="w-full h-3 bg-[var(--theme-dark)] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${weekendAvg}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[var(--theme-text-secondary)] rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Cards */}
      <div>
        <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-4">Daily Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {efficiency.map((day) => (
            <div key={day.day} className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-[var(--theme-text-primary)]">{dayLabels[day.day]}</span>
                <span className={`text-sm font-bold ${day.rate >= 80 ? 'text-[var(--theme-text-primary)]' : day.rate >= 60 ? 'text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-quaternary)]'}`}>
                  {Math.round(day.rate)}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--theme-text-tertiary)]">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>{day.completed}/{day.total} completed</span>
                </div>
              </div>
              <div className="mt-3 w-full h-2 bg-[var(--theme-dark)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${day.rate >= 80 ? 'bg-[var(--theme-foreground)]' : day.rate >= 60 ? 'bg-[var(--theme-text-secondary)]' : 'bg-[var(--theme-text-quaternary)]'}`}
                  style={{ width: `${day.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass p-6 rounded-xl border border-[var(--theme-border)]">
        <h3 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Recommendations
        </h3>
        <ul className="space-y-3 text-sm">
          {worstDay && worstDay.rate < 70 && (
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-foreground)] mt-2" />
              <span className="text-[var(--theme-text-secondary)]">
                <strong className="text-[var(--theme-text-primary)]">{dayLabels[worstDay.day]}</strong> is your weakest day. 
                Consider scheduling easier or fewer habits for this day.
              </span>
            </li>
          )}
          {weekendAvg < weekdayAvg - 15 && (
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-foreground)] mt-2" />
              <span className="text-[var(--theme-text-secondary)]">
                Your weekend completion drops significantly. Try adapting your routine for rest days.
              </span>
            </li>
          )}
          {bestDay && (
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-foreground)] mt-2" />
              <span className="text-[var(--theme-text-secondary)]">
                <strong className="text-[var(--theme-text-primary)]">{dayLabels[bestDay.day]}</strong> is your strongest day ({Math.round(bestDay.rate)}%). 
                Analyze what makes this day work and apply it elsewhere.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

