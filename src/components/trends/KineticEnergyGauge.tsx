'use client';

import { motion } from 'framer-motion';
import { Zap, Expand, TrendingUp, TrendingDown, Minus, Target, Flame, Award } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState, useMemo } from 'react';
import TrendDetailModal from './TrendDetailModal';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

const getMotivationalMessage = (score: number): string => {
  if (score >= 90) return "Unstoppable!";
  if (score >= 75) return "Peak mode";
  if (score >= 60) return "Momentum";
  if (score >= 45) return "Building up";
  if (score >= 30) return "Push harder";
  return "Get moving";
};

import { useMounted } from '@/hooks/useMounted';

export default function KineticEnergyGauge() {
  const { momentumScore, getOverallStats, habitLogs, habits, previousWeekMomentum } = useKineticStore();
  const mounted = useMounted();
  const [displayScore, setDisplayScore] = useState(50);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = mounted ? getOverallStats() : { totalHabits: 0, totalCompletions: 0, avgStreak: 0, longestStreak: 0 };

  // Calculate momentum trend (simulated based on completions)
  const momentumHistory = useMemo(() => {
    if (!mounted) return [];
    
    const history: { date: string; score: number; label: string }[] = [];
    let runningScore = 50;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0] || '';
      const dayLogs = habitLogs.filter(l => l.completedAt.startsWith(dateString));
      
      // Simulate momentum calculation
      const expectedHabits = habits.filter(h => !h.isArchived).length;
      const completionRate = expectedHabits > 0 ? dayLogs.length / expectedHabits : 0;
      
      if (completionRate >= 0.8) {
        runningScore = Math.min(100, runningScore + 3);
      } else if (completionRate >= 0.5) {
        runningScore = Math.min(100, runningScore + 1);
      } else if (completionRate > 0) {
        runningScore = Math.max(0, runningScore - 1);
      } else {
        runningScore = Math.max(0, runningScore - 3);
      }
      
      history.push({
        date: dateString,
        score: Math.round(runningScore),
        label: date.toLocaleDateString('en-US', { day: 'numeric' }),
      });
    }
    
    // Adjust final score to match current momentum
    if (history.length > 0) {
      const lastItem = history[history.length - 1];
      if (lastItem) {
        const adjustment = momentumScore - lastItem.score;
        history.forEach(h => {
          h.score = Math.max(0, Math.min(100, h.score + adjustment * 0.5));
        });
        lastItem.score = momentumScore;
      }
    }
    
    return history;
  }, [mounted, habitLogs, habits, momentumScore]);

  const momentumChange = mounted ? momentumScore - previousWeekMomentum : 0;

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (Math.abs(momentumScore - prev) < 1) return momentumScore;
        return prev + (momentumScore > prev ? 1 : -1);
      });
    }, 20);
    return () => clearInterval(interval);
  }, [momentumScore, mounted]);

  // Compact semi-circle arc
  const startAngle = 180;
  const endAngle = 360;
  const radius = 60;
  const strokeWidth = 8;
  const cx = 80;
  const cy = 70;
  
  const angleRange = endAngle - startAngle;
  const currentAngle = startAngle + (displayScore / 100) * angleRange;
  
  const polarToCartesian = (centerX: number, centerY: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: centerX + r * Math.cos(rad),
      y: centerY + r * Math.sin(rad),
    };
  };

  const describeArc = (centerX: number, centerY: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(centerX, centerY, r, end);
    const endPoint = polarToCartesian(centerX, centerY, r, start);
    const largeArcFlag = end - start <= 180 ? 0 : 1;
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y}`;
  };

  const pulseSpeed = Math.max(0.5, 2 - (displayScore / 50));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: pulseSpeed, repeat: Infinity }}
            className="w-6 h-6 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center"
          >
            <Zap className="w-3 h-3 text-[var(--theme-text-primary)]" fill="currentColor" />
          </motion.div>
          <h3 className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Energy</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          <span className="font-semibold">Analysis</span>
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main content row */}
      <div className="flex items-center gap-4">
        {/* Mini Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="160" height="85" viewBox="0 0 160 85">
            {/* Background arc */}
            <path
              d={describeArc(cx, cy, radius, startAngle, endAngle)}
              fill="none"
              stroke="var(--theme-foreground)"
              strokeOpacity="0.1"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <motion.path
              d={describeArc(cx, cy, radius, startAngle, currentAngle)}
              fill="none"
              stroke="var(--theme-foreground)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: displayScore > 60 ? 'drop-shadow(0 0 6px var(--theme-glow))' : 'none',
              }}
            />
            
            {/* Tick labels */}
            <text x="15" y="75" fill="var(--theme-text-muted)" fontSize="9" fontWeight="bold">0</text>
            <text x="75" y="12" fill="var(--theme-text-muted)" fontSize="9" fontWeight="bold">50</text>
            <text x="138" y="75" fill="var(--theme-text-muted)" fontSize="9" fontWeight="bold">100</text>
            
            {/* Score in center */}
            <text x={cx} y={cy + 5} fill="var(--theme-text-primary)" fontSize="28" fontWeight="bold" textAnchor="middle">
              {Math.round(displayScore)}
            </text>
          </svg>
        </div>

        {/* Stats column */}
        <div className="flex-1 space-y-2">
          <motion.p
            key={getMotivationalMessage(displayScore)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[var(--theme-text-primary)] font-semibold text-sm"
          >
            {getMotivationalMessage(displayScore)}
          </motion.p>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-lg font-bold text-[var(--theme-text-primary)]">{stats.totalHabits}</p>
              <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase">Habits</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--theme-text-primary)]">{stats.totalCompletions}</p>
              <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase">Done</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--theme-text-primary)]">{stats.longestStreak}</p>
              <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase">Best</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kinetic Energy Analysis"
        subtitle="30-day momentum score history and breakdown"
      >
        <div className="space-y-8">
          {/* Large Gauge Display */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="280" height="150" viewBox="0 0 280 150">
                {/* Background arc */}
                <path
                  d={describeArc(140, 130, 110, 180, 360)}
                  fill="none"
                  stroke="var(--theme-foreground)"
                  strokeOpacity="0.1"
                  strokeWidth={16}
                  strokeLinecap="round"
                />
                
                {/* Progress arc */}
                <motion.path
                  d={describeArc(140, 130, 110, 180, 180 + (displayScore / 100) * 180)}
                  fill="none"
                  stroke="var(--theme-foreground)"
                  strokeWidth={16}
                  strokeLinecap="round"
                  style={{
                    filter: displayScore > 60 ? 'drop-shadow(0 0 10px var(--theme-glow))' : 'none',
                  }}
                />
                
                {/* Tick marks */}
                <text x="20" y="135" fill="var(--theme-text-muted)" fontSize="12" fontWeight="bold">0</text>
                <text x="135" y="15" fill="var(--theme-text-muted)" fontSize="12" fontWeight="bold">50</text>
                <text x="250" y="135" fill="var(--theme-text-muted)" fontSize="12" fontWeight="bold">100</text>
                
                {/* Score */}
                <text x={140} y={110} fill="var(--theme-text-primary)" fontSize="56" fontWeight="bold" textAnchor="middle">
                  {Math.round(displayScore)}
                </text>
                <text x={140} y={135} fill="var(--theme-text-secondary)" fontSize="14" textAnchor="middle">
                  {getMotivationalMessage(displayScore)}
                </text>
              </svg>
            </div>
          </div>

          {/* Momentum History Chart */}
          <div>
            <h4 className="text-sm font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">
              30-Day Momentum History
            </h4>
            <div className="h-48 min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <AreaChart data={momentumHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-foreground)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--theme-foreground)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="var(--theme-border)"
                    tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--theme-background)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number | undefined) => [value ?? 0, 'Energy Score']}
                  />
                  <ReferenceLine y={50} stroke="var(--theme-border)" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--theme-foreground)"
                    fill="url(#energyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/10 border border-[var(--theme-foreground)]/20 text-center">
              <Zap className="w-6 h-6 text-[var(--theme-text-primary)] mx-auto mb-2" fill="currentColor" />
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{momentumScore}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Current Energy</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-center">
              <Target className="w-6 h-6 text-[var(--theme-text-secondary)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{stats.totalHabits}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Active Habits</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-center">
              <Award className="w-6 h-6 text-[var(--theme-text-secondary)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{stats.totalCompletions}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Total Done</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)] text-center">
              <Flame className="w-6 h-6 text-[var(--theme-text-secondary)] mx-auto mb-2" />
              <p className="text-3xl font-bold text-[var(--theme-text-primary)]">{stats.longestStreak}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Best Streak</p>
            </div>
          </div>

          {/* Week Over Week */}
          <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Week over Week</p>
                <p className="text-[var(--theme-text-primary)]">Compared to last week</p>
              </div>
              <div className={`flex items-center gap-2 text-2xl font-bold ${momentumChange >= 0 ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'}`}>
                {momentumChange > 0 ? <TrendingUp className="w-6 h-6" /> : 
                 momentumChange < 0 ? <TrendingDown className="w-6 h-6" /> : 
                 <Minus className="w-6 h-6" />}
                <span>{momentumChange >= 0 ? '+' : ''}{momentumChange}</span>
              </div>
            </div>
          </div>

          {/* Energy Level Guide */}
          <div className="p-4 rounded-xl bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]">
            <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider mb-4">Energy Level Guide</p>
            <div className="space-y-2">
              {[
                { range: '90-100', label: 'Unstoppable!', desc: 'Peak performance mode' },
                { range: '75-89', label: 'Peak Mode', desc: 'Excellent momentum' },
                { range: '60-74', label: 'Momentum', desc: 'Building strong habits' },
                { range: '45-59', label: 'Building Up', desc: 'Making progress' },
                { range: '30-44', label: 'Push Harder', desc: 'Room for improvement' },
                { range: '0-29', label: 'Get Moving', desc: 'Time to restart' },
              ].map((level, i) => (
                <div key={level.range} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[var(--theme-foreground)]' : i < 3 ? 'bg-[var(--theme-foreground)]/60' : 'bg-[var(--theme-foreground)]/30'}`} />
                  <span className="text-xs text-[var(--theme-text-secondary)] w-16">{level.range}</span>
                  <span className="text-sm text-[var(--theme-text-primary)]">{level.label}</span>
                  <span className="text-xs text-[var(--theme-text-secondary)]">— {level.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}
