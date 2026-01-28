'use client';

import { useEffect, useState } from 'react';
import { useKineticStore } from '@/store/useKineticStore';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useMounted } from '@/hooks/useMounted';
import { DEMO_HABIT_CONFIGS, generateHistoricalData, calculateStreaksForHabits } from '@/lib/demoData';

export default function DemoDataLoader() {
  const store = useKineticStore();
  const [showButton, setShowButton] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    // Only show the button if no data exists, after hydration
    if (mounted && store.habits.length === 0 && store.habitLogs.length === 0 && store.moodLogs.length === 0) {
      setShowButton(true);
    }
  }, [mounted, store.habits.length, store.habitLogs.length, store.moodLogs.length]);

  const loadDemoData = async () => {
    // Add habits
    for (const habit of DEMO_HABIT_CONFIGS) {
      await store.addHabit(habit);
    }
    
    // Generate 90 days of historical data
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
    const startDateISO = startDate.toISOString();

    // Update habits to have a past createdAt date
    useKineticStore.setState((state) => ({
      habits: state.habits.map(h => ({ ...h, createdAt: startDateISO }))
    }));

    const createdHabits = useKineticStore.getState().habits;
    const { logs, moods } = generateHistoricalData(createdHabits);
    const finalHabits = calculateStreaksForHabits(createdHabits, logs);
    
    // Directly set the state with all the generated data
    useKineticStore.setState((state) => ({
      habits: finalHabits,
      habitLogs: [...state.habitLogs, ...logs],
      moodLogs: [...state.moodLogs, ...moods],
      momentumScore: 85, // Start with a very good momentum
    }));
    
    setShowButton(false);
  };

  const resetAndLoadDemo = () => {
    // Clear all store data
    useKineticStore.setState({
      habits: [],
      habitLogs: [],
      moodLogs: [],
      momentumScore: 50,
      lastDecayDate: null,
      previousWeekMomentum: 50,
    });
    
    // Small delay to let state clear, then load demo
    setTimeout(() => {
      loadDemoData();
    }, 100);
  };

  const hasData = store.habits.length > 0 || store.habitLogs.length > 0;

  if (!mounted) return null;

  return (
    <>
      {showButton && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadDemoData}
          className="fixed bottom-24 right-8 px-5 py-3 rounded-full bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_var(--theme-glow)] hover:shadow-[0_0_30px_var(--theme-glow)] transition-all z-50 uppercase tracking-wide"
        >
          <Play className="w-4 h-4 fill-current" />
          Load Demo
        </motion.button>
      )}
      {hasData && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetAndLoadDemo}
          className="fixed bottom-24 right-8 px-4 py-2 rounded-full bg-[var(--theme-dark)] text-[var(--theme-text-secondary)] font-medium text-xs flex items-center gap-2 border border-[var(--theme-border)] hover:border-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] transition-all z-50 uppercase tracking-wide"
        >
          <Play className="w-3 h-3" />
          Reset Demo
        </motion.button>
      )}
    </>
  );
}
