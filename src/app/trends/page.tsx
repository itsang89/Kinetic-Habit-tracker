'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
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
import HabitHeatmap from '@/components/HabitHeatmap';
import MoodCorrelationChart from '@/components/MoodCorrelationChart';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TrendsFilterProvider, useTrendsFilter } from '@/contexts/TrendsFilterContext';
import { useKineticStore } from '@/store/useKineticStore';

function TrendsFilters() {
  const { filter, setDateRange, setHabitFilter } = useTrendsFilter() ?? { filter: null, setDateRange: () => {}, setHabitFilter: () => {} };
  const { habits } = useKineticStore();
  const [showHabitDropdown, setShowHabitDropdown] = useState(false);
  const activeHabits = habits.filter((h) => !h.deletedAt && !h.isArchived);

  if (!filter) return null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Calendar className="w-4 h-4 text-[var(--theme-text-muted)] flex-shrink-0" />
        {(['7', '30', '90'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => setDateRange(preset)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter.preset === preset
                ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]'
                : 'bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10'
            }`}
          >
            Last {preset} Days
          </button>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowHabitDropdown(!showHabitDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-foreground)]/5 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-foreground)]/10 text-sm"
        >
          <Filter className="w-4 h-4" />
          {filter.habitFilterId
            ? activeHabits.find((h) => h.id === filter.habitFilterId)?.name ?? 'Filter'
            : 'All Habits'}
        </button>
        {showHabitDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowHabitDropdown(false)} aria-hidden="true" />
            <div className="absolute left-0 mt-2 py-1 glass rounded-xl shadow-lg z-20 min-w-[200px] max-h-48 overflow-y-auto">
              <button
                onClick={() => { setHabitFilter(null); setShowHabitDropdown(false); }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10"
              >
                All Habits
              </button>
              {activeHabits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setHabitFilter(h.id); setShowHabitDropdown(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--theme-foreground)]/10 ${
                    filter.habitFilterId === h.id ? 'text-[var(--brand-main)] font-medium' : 'text-[var(--theme-text-primary)]'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <ProtectedRoute>
      <TrendsFilterProvider>
        <TrendsPageContent />
      </TrendsFilterProvider>
    </ProtectedRoute>
  );
}

function TrendsPageContent() {
  return (
      <div className="min-h-screen pb-28 selection:bg-[var(--brand-main)] selection:text-[var(--bg-base)]">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-[var(--brand-main)]/[0.08] rounded-full blur-3xl -translate-y-1/2" />
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
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--brand-main)]/35 to-transparent" />
              <h2 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-[0.3em]">Stats & Trends</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--brand-main)]/35 to-transparent" />
            </div>

            <TrendsFilters />

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {/* Row 1: Energy Gauge, Volume, Streak */}
              <div className="glass depth-hover p-5 rounded-2xl md:col-span-2 lg:col-span-2">
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
              
              {/* Row 4: Consistency Heatmap, Mood Correlation */}
              <div className="md:col-span-2 lg:col-span-3">
                <TrendsHeatmapWrapper />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <MoodCorrelationChart />
              </div>

              {/* Row 5: Paper Chain (full width) */}
              <div className="md:col-span-2 lg:col-span-3">
                <TrendsPaperChainWrapper />
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
  );
}

function TrendsHeatmapWrapper() {
  const { filter } = useTrendsFilter() ?? { filter: null };
  return <HabitHeatmap habitId={filter?.habitFilterId ?? undefined} />;
}

function TrendsPaperChainWrapper() {
  const { filter } = useTrendsFilter() ?? { filter: null };
  const days = filter?.days ?? 30;
  return <PaperChain days={days} />;
}
