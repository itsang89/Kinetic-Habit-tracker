'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit3, Flame, Target, Trophy, Calendar, Clock, 
  TrendingUp, Droplet, Book, Brain, Dumbbell, Heart, Sun, Moon, 
  Coffee, Pencil, Code, Music, Leaf, Zap, Star, Shield, X, Check,
  ChevronLeft, ChevronRight, Trash2, Archive, Bell, Settings
} from 'lucide-react';
import { useKineticStore, Habit, HabitIcon, DayOfWeek } from '@/store/useKineticStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import BottomNav from '@/components/BottomNav';
import EditHabitModal from '@/components/habits/EditHabitModal';
import ProtectedRoute from '@/components/ProtectedRoute';

const iconMap: Record<HabitIcon, React.ElementType> = {
  droplet: Droplet, book: Book, brain: Brain, dumbbell: Dumbbell,
  heart: Heart, sun: Sun, moon: Moon, coffee: Coffee, pencil: Pencil,
  code: Code, music: Music, leaf: Leaf, target: Target, zap: Zap, star: Star,
};

export default function HabitDetailPage() {
  const params = useParams();
  const habitId = params.id as string;
  const router = useRouter();
  
  const { 
    habits, habitLogs, moodLogs, 
    getWeeklyHabitData, getHabitHealth, getBestStreak,
    archiveHabit, deleteHabit, isHabitCompletedToday,
    getTimeOfDayPerformance, setGlobalModalOpen
  } = useKineticStore();
  
  const [mounted, setMounted] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (showSettings) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showSettings, setGlobalModalOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const habit = mounted ? habits.find(h => h.id === habitId) : null;
  
  // Calculate habit-specific stats
  const habitStats = useMemo(() => {
    if (!mounted || !habit) return null;

    const logs = habitLogs.filter(l => l.habitId === habitId);
    const totalLogs = logs.length;
    
    // Success rate (last 30 days)
    const last30Days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habitCreatedAt = new Date(habit.createdAt);
    habitCreatedAt.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
      
      // Fix: Only count if scheduled AND habit existed on that day AND not in the future
      const isScheduled = habit.schedule.includes(dayOfWeek) && date >= habitCreatedAt && date <= today;
      
      if (isScheduled) {
        const completed = logs.some(l => l.completedAt.startsWith(dateString));
        last30Days.push({ date: dateString, scheduled: true, completed });
      }
    }
    
    const scheduledDays = last30Days.filter(d => d.scheduled).length;
    const completedDays = last30Days.filter(d => d.completed).length;
    const successRate = scheduledDays > 0 ? (completedDays / scheduledDays) * 100 : 0;
    
    // Total volume
    const totalVolume = logs.reduce((sum, l) => sum + l.value, 0);
    
    return {
      totalLogs,
      successRate,
      totalVolume,
      scheduledDays,
      completedDays,
    };
  }, [mounted, habit, habitLogs, habitId]);

  // Calendar data for current month
  const calendarData = useMemo(() => {
    if (!mounted || !habit) return [];
    
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habitCreatedAt = new Date(habit.createdAt);
    habitCreatedAt.setHours(0, 0, 0, 0);
    
    const days: {
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isScheduled: boolean;
      isCompleted: boolean;
      isPartial: boolean;
      isShielded: boolean;
      value: number | null;
      isFuture: boolean;
      isBeforeCreation: boolean;
    }[] = [];
    
    // Add empty days for alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ 
        date: '', day: 0, isCurrentMonth: false, isScheduled: false, 
        isCompleted: false, isPartial: false, isShielded: false, 
        value: null, isFuture: false, isBeforeCreation: false 
      });
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
      
      const isFuture = date > today;
      const isBeforeCreation = date < habitCreatedAt;
      
      const isScheduled = habit.schedule.includes(dayOfWeek);
      const log = habitLogs.find(l => l.habitId === habitId && l.completedAt.startsWith(dateString));
      
      days.push({
        date: dateString,
        day,
        isCurrentMonth: true,
        isScheduled,
        isCompleted: !!log,
        isPartial: log ? log.value < habit.target : false,
        isShielded: false, // Would need shield tracking
        value: log?.value || null,
        isFuture,
        isBeforeCreation,
      });
    }
    
    return days;
  }, [mounted, habit, habitLogs, habitId, calendarMonth]);

  // Time of day analysis for this habit
  const timeAnalysis = useMemo(() => {
    if (!mounted || !habit) return [];
    
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;
    
    habitLogs
      .filter(l => l.habitId === habitId)
      .forEach(log => {
        const hour = new Date(log.completedAt).getHours();
        hourCounts[hour]++;
      });
    
    // Group into time blocks
    const blocks = [
      { label: '6-9am', hours: [6, 7, 8], count: 0 },
      { label: '9-12pm', hours: [9, 10, 11], count: 0 },
      { label: '12-3pm', hours: [12, 13, 14], count: 0 },
      { label: '3-6pm', hours: [15, 16, 17], count: 0 },
      { label: '6-9pm', hours: [18, 19, 20], count: 0 },
      { label: '9-12am', hours: [21, 22, 23], count: 0 },
    ];
    
    blocks.forEach(block => {
      block.count = block.hours.reduce((sum, h) => sum + hourCounts[h], 0);
    });
    
    return blocks;
  }, [mounted, habit, habitLogs, habitId]);

  // Score trend (momentum over time)
  const scoreTrend = useMemo(() => {
    if (!mounted || !habit) return [];
    
    const data: { date: string; score: number }[] = [];
    let runningScore = 50;
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
      
      if (habit.schedule.includes(dayOfWeek)) {
        const completed = habitLogs.some(l => l.habitId === habitId && l.completedAt.startsWith(dateString));
        if (completed) {
          runningScore = Math.min(100, runningScore + 3);
        } else {
          runningScore = Math.max(0, runningScore - 5);
        }
      }
      
      if (i % 7 === 0) { // Weekly data points
        data.push({ date: dateString, score: Math.round(runningScore) });
      }
    }
    
    return data;
  }, [mounted, habit, habitLogs, habitId]);

  // History log
  const historyLog = useMemo(() => {
    if (!mounted || !habit) return [];
    
    return habitLogs
      .filter(l => l.habitId === habitId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 50)
      .map(log => {
        const date = new Date(log.completedAt);
        const moodLog = moodLogs.find(m => m.loggedAt.startsWith(log.completedAt.split('T')[0]));
        return {
          ...log,
          formattedDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          formattedTime: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          mood: moodLog?.score || null,
        };
      });
  }, [mounted, habit, habitLogs, moodLogs, habitId]);

  // Find peak time
  const peakTime = useMemo(() => {
    const max = timeAnalysis.reduce((best, block) => block.count > best.count ? block : best, { label: '', count: 0 });
    return max.label;
  }, [timeAnalysis]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--theme-foreground)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-[var(--theme-text-secondary)] mb-4">Habit not found</p>
        <button onClick={() => router.push('/habits')} className="text-[var(--theme-text-primary)] underline">
          Back to Habits
        </button>
      </div>
    );
  }

  const Icon = iconMap[habit.icon] || Star;
  const health = getHabitHealth(habitId);
  const bestStreak = habit.bestStreak || 0;

  const handleDelete = () => {
    if (confirm('Delete this habit? This cannot be undone.')) {
      deleteHabit(habitId);
      router.push('/habits');
    }
  };

  const handleArchive = () => {
    archiveHabit(habitId);
    router.push('/habits');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-[var(--theme-foreground)]/[0.03] rounded-full blur-3xl -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-4">
            <button 
              onClick={() => router.push('/habits')}
              className="flex items-center gap-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <button 
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-full hover:bg-[var(--theme-foreground)]/10 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-[var(--theme-text-secondary)]" />
            </button>
          </div>

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            {/* Progress Ring with Icon */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  fill="none" stroke="var(--theme-foreground)" strokeOpacity="0.1" strokeWidth="6"
                />
                <motion.circle
                  cx="48" cy="48" r="42"
                  fill="none" stroke="var(--theme-foreground)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - health / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ filter: 'drop-shadow(0 0 8px var(--theme-glow))' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-10 h-10 text-[var(--theme-text-primary)]" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-[var(--theme-text-primary)] mb-1">{habit.name}</h1>
            <p className="text-sm text-[var(--theme-text-secondary)]">{habit.target} {habit.unit}/day</p>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Flame className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  <span className="text-xl font-bold text-[var(--theme-text-primary)]">{habit.streak}</span>
                </div>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Current Streak</p>
              </div>
              <div className="w-px h-8 bg-[var(--theme-border)]" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Target className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                  <span className="text-xl font-bold text-[var(--theme-text-primary)]">{Math.round(habitStats?.successRate || 0)}%</span>
                </div>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Success Rate</p>
              </div>
              <div className="w-px h-8 bg-[var(--theme-border)]" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Trophy className="w-4 h-4 text-[var(--theme-text-muted)]" />
                  <span className="text-xl font-bold text-[var(--theme-text-secondary)]">{bestStreak}</span>
                </div>
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Best Streak</p>
              </div>
            </div>
          </motion.div>

          {/* Calendar Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl mb-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--theme-text-primary)]" />
                <h2 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-widest">History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-1 rounded hover:bg-[var(--theme-foreground)]/10"
                >
                  <ChevronLeft className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                </button>
                <span className="text-sm text-[var(--theme-text-secondary)] min-w-[120px] text-center">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-1 rounded hover:bg-[var(--theme-foreground)]/10"
                >
                  <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-[var(--theme-text-muted)] font-bold py-2">{d}</div>
              ))}
              {calendarData.map((day, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {day.isCurrentMonth ? (
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium relative
                      ${!day.isScheduled || day.isFuture || day.isBeforeCreation ? 'text-[var(--theme-text-muted)]' : ''}
                      ${day.isCompleted && !day.isPartial ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : ''}
                      ${day.isPartial ? 'bg-[var(--theme-foreground)]/50 text-[var(--theme-text-primary)]' : ''}
                      ${day.isScheduled && !day.isCompleted && !day.isFuture && !day.isBeforeCreation ? 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] border border-[var(--theme-border)]' : ''}
                      ${day.isShielded ? 'ring-2 ring-blue-500' : ''}
                    `}>
                      {day.isShielded && <Shield className="absolute -top-1 -right-1 w-3 h-3 text-blue-400" />}
                      {day.day}
                    </div>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[var(--theme-border)]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]" />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]/50" />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Partial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[var(--theme-foreground)]/5 border border-[var(--theme-border)]" />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Missed</span>
              </div>
            </div>
          </motion.div>

          {/* Analytics Cards */}
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
                    <XAxis 
                      dataKey="date" 
                      tick={false}
                      axisLine={false}
                    />
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
                  {habitStats && habitStats.successRate >= 80 
                    ? `Great consistency! You've completed ${habit.name} on ${habitStats.completedDays} of the last ${habitStats.scheduledDays} scheduled days.`
                    : habitStats && habitStats.successRate >= 50
                      ? `You're building momentum. Focus on ${habit.schedule.slice(0, 2).join(' and ')} to improve your streak.`
                      : `This habit needs attention. Try scheduling it at a consistent time each day.`
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* History Log */}
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

          {/* Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass p-6 rounded-2xl"
          >
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--theme-text-secondary)]" />
                <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Settings</h3>
              </div>
              <ChevronRight className={`w-4 h-4 text-[var(--theme-text-muted)] transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 space-y-4">
                    {/* Schedule */}
                    <div className="flex items-center justify-between py-3 border-b border-[var(--theme-border)]">
                      <div>
                        <p className="text-[var(--theme-text-primary)] text-sm font-medium">Schedule</p>
                        <p className="text-xs text-[var(--theme-text-secondary)]">{habit.schedule.join(', ')}</p>
                      </div>
                      <button 
                        onClick={() => setShowEditModal(true)}
                        className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Reminders (placeholder) */}
                    <div className="flex items-center justify-between py-3 border-b border-[var(--theme-border)]">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-[var(--theme-text-muted)]" />
                        <div>
                          <p className="text-[var(--theme-text-primary)] text-sm font-medium">Reminders</p>
                          <p className="text-xs text-[var(--theme-text-secondary)]">Not set</p>
                        </div>
                      </div>
                      <button className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
                        Set up
                      </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 space-y-2">
                      <button
                        onClick={handleArchive}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        <span className="text-sm font-medium">Pause Habit</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete Habit</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <BottomNav />
        
        <EditHabitModal
          habit={habit}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
