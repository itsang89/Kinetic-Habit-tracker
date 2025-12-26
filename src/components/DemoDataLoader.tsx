'use client';

import { useEffect, useState } from 'react';
import { useKineticStore, DayOfWeek, HabitLog, MoodLog, HabitCategory, HabitIcon, HabitType } from '@/store/useKineticStore';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function DemoDataLoader() {
  const store = useKineticStore();
  const [showButton, setShowButton] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show the button if no data exists, after hydration
    if (mounted && store.habits.length === 0 && store.habitLogs.length === 0 && store.moodLogs.length === 0) {
      setShowButton(true);
    }
  }, [mounted, store.habits.length, store.habitLogs.length, store.moodLogs.length]);

  const loadDemoData = () => {
    // Create habits with categories, icons, and types
    const habitConfigs: { name: string; unit: string; target: number; schedule: DayOfWeek[]; category: HabitCategory; icon: HabitIcon; type: HabitType }[] = [
      { name: 'Morning Meditation', unit: 'mins', target: 15, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'mindfulness', icon: 'sun', type: 'duration' },
      { name: 'Read Books', unit: 'pages', target: 20, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'], category: 'learning', icon: 'book', type: 'count' },
      { name: 'Deep Work', unit: 'hours', target: 4, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], category: 'productivity', icon: 'brain', type: 'count' },
      { name: 'Exercise', unit: 'mins', target: 45, schedule: ['Mon', 'Wed', 'Fri', 'Sat'], category: 'fitness', icon: 'dumbbell', type: 'duration' },
      { name: 'Journal', unit: 'entry', target: 1, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'mindfulness', icon: 'pencil', type: 'simple' },
      { name: 'Drink Water', unit: 'cups', target: 8, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'health', icon: 'droplet', type: 'count' },
      { name: 'Code Practice', unit: 'mins', target: 60, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], category: 'learning', icon: 'code', type: 'duration' },
      { name: 'Sunlight Exposure', unit: 'mins', target: 15, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'health', icon: 'sun', type: 'duration' },
      { name: 'Deep Breathing', unit: 'sets', target: 3, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'mindfulness', icon: 'zap', type: 'count' },
      { name: 'No Alcohol', unit: 'day', target: 1, schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], category: 'health', icon: 'shield', type: 'simple' },
    ];

    // Add habits
    habitConfigs.forEach((habit) => store.addHabit(habit));
    
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
    const logs: HabitLog[] = [];
    const moods: MoodLog[] = [];
    
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
      
      // Simulate habit completions with varying completion rates
      createdHabits.forEach((habit, habitIndex) => {
        if (!habit.schedule.includes(dayOfWeek)) return;
        
        // Different interaction rates for different habits (50-98%)
        const baseInteractionRate = 0.5 + (habitIndex * 0.04);
        // Weekends have slightly lower completion for productivity/learning
        const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
        const weekendPenalty = (isWeekend && (habit.category === 'productivity' || habit.category === 'learning')) ? 0.2 : 0;
        // Recent days have higher completion (building momentum)
        const recencyBonus = daysAgo < 21 ? 0.2 : 0;
        
        const interactionChance = Math.min(0.98, baseInteractionRate - weekendPenalty + recencyBonus);
        
        if (Math.random() < interactionChance) {
          // Vary the completion time throughout the day (6am - 11pm)
          const hour = 6 + Math.floor(Math.random() * 17);
          const minute = Math.floor(Math.random() * 60);
          const completedAt = new Date(date);
          completedAt.setHours(hour, minute, 0, 0);
          
          // Calculate a value - sometimes partial, sometimes full, sometimes over
          let value = habit.target;
          const randomFactor = Math.random();
          
          if (habit.type === 'simple') {
              value = 1;
          } else {
              if (randomFactor < 0.15) {
                  // Partial (30-90%)
                  value = Math.floor(habit.target * (0.3 + Math.random() * 0.6));
              } else if (randomFactor < 0.85) {
                  // Exactly target
                  value = habit.target;
              } else {
                  // Over target (up to 150%)
                  value = Math.floor(habit.target * (1.0 + Math.random() * 0.5));
              }
          }
          
          logs.push({
            id: generateId(),
            habitId: habit.id,
            completedAt: completedAt.toISOString(),
            value: value,
          });
        }
      });
      
      // Log mood (mostly between 4-10, with some variation)
      const baseMood = 6.0;
      // Mood correlates strongly with habit completion rate
      const dayLogs = logs.filter(l => l.completedAt.startsWith(dateString));
      const scheduledForDay = createdHabits.filter(h => h.schedule.includes(dayOfWeek)).length;
      const completionRate = scheduledForDay > 0 ? dayLogs.length / scheduledForDay : 1;
      
      const moodBonus = Math.min(4, completionRate * 4);
      const randomVariation = (Math.random() - 0.5) * 2.5;
      const moodScore = Math.round(Math.max(1, Math.min(10, baseMood + moodBonus + randomVariation)));
      
      moods.push({
        id: generateId(),
        score: moodScore,
        loggedAt: new Date(date.setHours(21, 0, 0, 0)).toISOString(),
      });
    }
    
    // Update streaks and best streaks based on generated logs
    const finalHabits = createdHabits.map(habit => {
      let currentStreak = 0;
      let maxStreak = 0;
      
      // Iterate from oldest to newest to calculate streaks
      for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
        
        if (habit.schedule.includes(dayOfWeek)) {
          const log = logs.find(l => l.habitId === habit.id && l.completedAt.startsWith(dateString));
          const isCompleted = log ? log.value >= habit.target : false;
          
          if (isCompleted) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            // Only reset streak if the day is in the past (not today)
            if (daysAgo > 0) {
              currentStreak = 0;
            }
          }
        }
      }
      
      return {
        ...habit,
        streak: currentStreak,
        bestStreak: maxStreak
      };
    });
    
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

  // Show load button if no data, show reset button if there's data
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
