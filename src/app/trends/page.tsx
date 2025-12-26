'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import KineticEnergyGauge from '@/components/trends/KineticEnergyGauge';
import PaperChain from '@/components/trends/PaperChain';
import TotalVolumeCards from '@/components/trends/TotalVolumeCards';
import StreakComparison from '@/components/trends/StreakComparison';
import DayEfficiencyChart from '@/components/trends/DayEfficiencyChart';
import TimePerformanceChart from '@/components/trends/TimePerformanceChart';
import MoodInsightCard from '@/components/trends/MoodInsightCard';
import HabitHealthGrid from '@/components/trends/HabitHealthGrid';
import WeeklyWrapCard from '@/components/trends/WeeklyWrapCard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TrendsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28 selection:bg-[var(--theme-foreground)] selection:text-[var(--theme-background)]">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--theme-foreground)]/[0.02] rounded-full blur-3xl -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12 pt-4">
          <Header />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            {/* Section Title */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--theme-foreground)]/20 to-transparent" />
              <h2 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-[0.3em]">Stats & Trends</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--theme-foreground)]/20 to-transparent" />
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {/* Row 1: Energy Gauge, Volume, Streak */}
              <div className="glass p-5 rounded-2xl md:col-span-2 lg:col-span-2">
                <KineticEnergyGauge />
              </div>
              <div className="lg:col-span-1">
                <StreakComparison />
              </div>
              
              {/* Row 2: Volume Cards */}
              <div className="md:col-span-2 lg:col-span-3">
                <TotalVolumeCards />
              </div>
              
              {/* Row 3: Weekly Wrap, Mood Insight */}
              <div className="lg:col-span-1">
                <WeeklyWrapCard />
              </div>
              <div className="lg:col-span-2">
                <MoodInsightCard />
              </div>
              
              {/* Row 4: Paper Chain (full width) */}
              <div className="md:col-span-2 lg:col-span-3">
                <PaperChain />
              </div>
              
              {/* Row 5: Day Efficiency, Habit Health */}
              <div className="md:col-span-1 lg:col-span-1">
                <DayEfficiencyChart />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <HabitHealthGrid />
              </div>
              
              {/* Row 6: Time Performance */}
              <div className="md:col-span-2 lg:col-span-3">
                <TimePerformanceChart />
              </div>
            </div>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
