'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import CompactStats from '@/components/CompactStats';
import CalendarStrip from '@/components/CalendarStrip';
import HabitList from '@/components/HabitList';
import MoodSlider from '@/components/MoodSlider';
import DemoDataLoader from '@/components/DemoDataLoader';
import BottomNav from '@/components/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useState } from 'react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
        {/* Background decoration - Subtle Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--theme-foreground)]/[0.03] rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--theme-foreground)]/[0.02] rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-4 pb-12 pt-4">
          <Header />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-6 space-y-6"
          >
            {/* Top Section: Compact Stats & Calendar */}
            <div>
              <CompactStats />
              <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>

            {/* Main List */}
            <HabitList date={dateString} />

            {/* Bottom Section: Mood */}
            <MoodSlider date={dateString} />
          </motion.div>
        </div>

        <DemoDataLoader />
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
