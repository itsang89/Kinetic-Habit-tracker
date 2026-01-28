'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useKineticStore } from '@/store/useKineticStore';
import BottomNav from '@/components/BottomNav';
import EditHabitModal from '@/components/habits/EditHabitModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useMounted } from '@/hooks/useMounted';
import { useHabitProgress } from '@/hooks/useHabitProgress';
import { calculateHabitStats, generateCalendarData } from '@/lib/habitCalculations';
import Link from 'next/link';

// Detail sub-components
import HabitDetailHeader from '@/components/habits/detail/HabitDetailHeader';
import HabitDetailStats from '@/components/habits/detail/HabitDetailStats';
import HabitCalendar from '@/components/habits/detail/HabitCalendar';
import HabitAnalytics from '@/components/habits/detail/HabitAnalytics';
import HabitHistory from '@/components/habits/detail/HabitHistory';
import HabitSettings from '@/components/habits/detail/HabitSettings';

export default function HabitDetailPage() {
  const params = useParams();
  const habitId = params.id as string;
  const router = useRouter();
  
  const { 
    habits, habitLogs, moodLogs, 
    getHabitHealth, archiveHabit, deleteHabit, 
    setGlobalModalOpen
  } = useKineticStore();
  
  const mounted = useMounted();
  const [showEditModal, setShowEditModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const habit = useMemo(() => habits.find(h => h.id === habitId), [habits, habitId]);
  const progress = useHabitProgress(habitId);
  const health = getHabitHealth(habitId);

  useEffect(() => {
    if (showSettings || showDeleteConfirm || showArchiveConfirm) {
      setGlobalModalOpen(true);
      return () => setGlobalModalOpen(false);
    }
  }, [showSettings, showDeleteConfirm, showArchiveConfirm, setGlobalModalOpen]);

  // Calculations
  const habitStats = useMemo(() => {
    if (!habit) return null;
    return calculateHabitStats(habit, habitLogs);
  }, [habit, habitLogs]);

  const calendarData = useMemo(() => {
    if (!habit) return [];
    return generateCalendarData(habit, habitLogs, calendarMonth);
  }, [habit, habitLogs, calendarMonth]);

  const timeAnalysis = useMemo(() => {
    if (!habit) return [];
    
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;
    
    habitLogs
      .filter(l => l.habitId === habitId)
      .forEach(log => {
        const hour = new Date(log.completedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
    
    return [
      { label: '6-9am', hours: [6, 7, 8], count: 0 },
      { label: '9-12pm', hours: [9, 10, 11], count: 0 },
      { label: '12-3pm', hours: [12, 13, 14], count: 0 },
      { label: '3-6pm', hours: [15, 16, 17], count: 0 },
      { label: '6-9pm', hours: [18, 19, 20], count: 0 },
      { label: '9-12am', hours: [21, 22, 23], count: 0 },
    ].map(block => ({
      ...block,
      count: block.hours.reduce((sum, h) => sum + (hourCounts[h] || 0), 0)
    }));
  }, [habitLogs, habitId, habit]);

  const scoreTrend = useMemo(() => {
    if (!habit) return [];
    
    const data: { date: string; score: number }[] = [];
    let runningScore = 50;
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0] || '';
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as any;
      
      if (habit.schedule.includes(dayOfWeek)) {
        const completed = habitLogs.some(l => l.habitId === habitId && l.completedAt.startsWith(dateString));
        if (completed) {
          runningScore = Math.min(100, runningScore + 3);
        } else {
          runningScore = Math.max(0, runningScore - 5);
        }
      }
      
      if (i % 7 === 0) {
        data.push({ date: dateString, score: Math.round(runningScore) });
      }
    }
    
    return data;
  }, [habit, habitLogs, habitId]);

  const historyLog = useMemo(() => {
    if (!habit) return [];
    
    return habitLogs
      .filter(l => l.habitId === habitId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 50)
      .map(log => {
        const date = new Date(log.completedAt);
        const moodLog = moodLogs.find(m => m.loggedAt.startsWith(log.completedAt.split('T')[0] || ''));
        return {
          id: log.id,
          formattedDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          formattedTime: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          value: log.value,
          mood: moodLog?.score || null,
        };
      });
  }, [habit, habitLogs, moodLogs, habitId]);

  const peakTime = useMemo(() => {
    const max = timeAnalysis.reduce((best, block) => block.count > best.count ? block : best, { label: '', count: 0 });
    return max.label;
  }, [timeAnalysis]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-[var(--theme-text-secondary)] mb-4">Habit not found</p>
        <Link href="/habits" className="text-[var(--theme-text-primary)] underline">
          Back to Habits
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteHabit(habitId);
    router.push('/habits');
  };

  const handleArchive = () => {
    archiveHabit(habitId);
    router.push('/habits');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-[var(--theme-foreground)]/[0.03] rounded-full blur-3xl -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <HabitDetailHeader 
            habit={habit} 
            health={health} 
            onEdit={() => setShowEditModal(true)} 
          />

          <HabitDetailStats 
            habit={habit} 
            successRate={habitStats?.successRate || 0} 
          />

          <HabitCalendar 
            calendarMonth={calendarMonth} 
            onMonthChange={setCalendarMonth} 
            calendarData={calendarData} 
          />

          <HabitAnalytics 
            habit={habit}
            scoreTrend={scoreTrend}
            timeAnalysis={timeAnalysis}
            peakTime={peakTime}
            successRate={habitStats?.successRate || 0}
            completedDays={habitStats?.completedDays || 0}
            scheduledDays={habitStats?.scheduledDays || 0}
          />

          <HabitHistory 
            habit={habit} 
            historyLog={historyLog} 
          />

          <HabitSettings 
            habit={habit}
            showSettings={showSettings}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onEdit={() => setShowEditModal(true)}
            onArchive={() => setShowArchiveConfirm(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </div>

        <BottomNav />
        
        <EditHabitModal
          habit={habit}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Habit?"
          message={`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
        />

        <ConfirmDialog
          isOpen={showArchiveConfirm}
          onClose={() => setShowArchiveConfirm(false)}
          onConfirm={handleArchive}
          title="Pause Habit?"
          message={`Are you sure you want to pause "${habit.name}"? You can unpause it later.`}
          confirmLabel="Pause"
        />
      </div>
    </ProtectedRoute>
  );
}
