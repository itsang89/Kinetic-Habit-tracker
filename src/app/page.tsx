'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CompactStats from '@/components/CompactStats';
import MomentumScore from '@/components/MomentumScore';
import CalendarStrip from '@/components/CalendarStrip';
import HabitList from '@/components/HabitList';
import MoodSlider from '@/components/MoodSlider';
import StreakRescueCard from '@/components/StreakRescueCard';
import OnboardingCard from '@/components/OnboardingCard';
import DemoDataLoader from '@/components/DemoDataLoader';
import BottomNav from '@/components/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getLocalDateKey } from '@/lib/dateUtils';
import { useKineticStore } from '@/store/useKineticStore';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const selectedDate = useKineticStore((s) => s.selectedDate);
  const setSelectedDate = useKineticStore((s) => s.setSelectedDate);
  const habits = useKineticStore((s) => s.habits);

  const activeHabits = habits.filter((h) => !h.deletedAt);
  const showOnboarding = activeHabits.length === 0;

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const handleDateSelect = (date: Date) => setSelectedDate(getLocalDateKey(date));
  const handleCreateHabit = () => router.push('/habits?add=true');

  const fetchFromCloud = useKineticStore((s) => s.fetchFromCloud);
  const [refreshing, setRefreshing] = useState(false);
  const lastSyncedAt = useKineticStore((s) => s.lastSyncedAt);
  const { user } = useAuth();
  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchFromCloud();
    setRefreshing(false);
  }, [fetchFromCloud, user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--brand-main)] selection:text-[var(--bg-base)]">
        {/* Background decoration - Subtle Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--brand-main)]/[0.10] rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--brand-300)]/[0.08] rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-4 pb-12 pt-4">
          <Header onRefresh={onRefresh} isRefreshing={refreshing} showSync={!!user} />
          {user && lastSyncedAt && (
            <p className="text-[10px] text-[var(--theme-text-muted)] -mt-2 mb-2">
              Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-6 space-y-6"
          >
            {showOnboarding ? (
              <OnboardingCard onCreateHabit={handleCreateHabit} />
            ) : (
              <>
                <div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <CompactStats />
                    <MomentumScore />
                  </div>
                  <CalendarStrip selectedDate={selectedDateObj} onDateSelect={handleDateSelect} />
                </div>
                <HabitList date={selectedDate} />
                <StreakRescueCard date={selectedDate} />
                <MoodSlider date={selectedDate} />
              </>
            )}
          </motion.div>
        </div>

        {!showOnboarding && <DemoDataLoader />}
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}

