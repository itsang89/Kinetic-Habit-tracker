import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncToCloud, fetchFromCloud } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type HabitCategory = 'health' | 'learning' | 'productivity' | 'mindfulness' | 'fitness' | 'other';

export type HabitType = 'simple' | 'duration' | 'count';

export type HabitIcon = 'droplet' | 'book' | 'brain' | 'dumbbell' | 'heart' | 'sun' | 'moon' | 'coffee' | 'pencil' | 'code' | 'music' | 'leaf' | 'target' | 'zap' | 'star' | 'shield';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  unit: string;
  target: number;
  schedule: DayOfWeek[];
  streak: number;
  bestStreak: number;
  shieldAvailable: boolean;
  createdAt: string;
  category: HabitCategory;
  icon: HabitIcon;
  isArchived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string;
  value: number;
}

export interface MoodLog {
  id: string;
  score: number;
  loggedAt: string;
}

export interface WeeklySummary {
  topHabit: { name: string; completions: number } | null;
  totalCompletions: number;
  completionRate: number;
  momentumChange: number;
  avgMood: number | null;
}

export type Theme = 'light' | 'dark';

interface KineticState {
  // User data
  userName: string;
  userIcon: HabitIcon;
  habits: Habit[];
  habitLogs: HabitLog[];
  moodLogs: MoodLog[];
  
  // Computed
  momentumScore: number;
  lastDecayDate: string | null;
  previousWeekMomentum: number;
  
  // Sync state
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
  
  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'shieldAvailable' | 'createdAt' | 'isArchived' | 'category' | 'icon' | 'type'> & Partial<Pick<Habit, 'category' | 'icon' | 'type'>>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  updateUserProfile: (name: string, icon: HabitIcon) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  resetHabitStats: (habitId: string) => Promise<void>;
  bulkArchive: (habitIds: string[]) => Promise<void>;
  bulkUnarchive: (habitIds: string[]) => Promise<void>;
  bulkDelete: (habitIds: string[]) => Promise<void>;
  bulkChangeCategory: (habitIds: string[], category: HabitCategory) => Promise<void>;
  logHabitCompletion: (habitId: string, value?: number, date?: string) => Promise<void>;
  removeHabitCompletion: (habitId: string, date?: string) => Promise<void>;
  useShield: (habitId: string) => Promise<void>;
  logMood: (score: number, date?: string) => Promise<void>;
  
  // Cloud sync actions
  syncToCloud: () => Promise<void>;
  fetchFromCloud: () => Promise<void>;
  initializeStore: () => Promise<void>;

  calculateMomentumScore: () => number;
  applyDailyDecay: () => void;
  getHabitProgress: (habitId: string, date: string) => { current: number; target: number; percent: number };
  getTodaysMood: () => number | null;
  getMoodOnDate: (date: string) => number | null;
  isHabitCompletedToday: (habitId: string) => boolean;
  isHabitCompletedOnDate: (habitId: string, date: string) => boolean;
  getHabitLogsForDate: (habitId: string, date: string) => HabitLog[];
  getWeeklyHabitData: (habitId: string) => { date: string; completed: boolean }[];
  getYearlyHabitData: (habitId: string) => { date: string; count: number }[];
  getMoodCorrelationData: () => { date: string; mood: number; completionRate: number }[];
  
  // New Trends selectors
  getTotalVolume: () => { habitId: string; name: string; total: number; unit: string }[];
  getBestStreak: (habitId: string) => number;
  getDayOfWeekEfficiency: () => { day: DayOfWeek; rate: number; total: number; completed: number }[];
  getTimeOfDayPerformance: () => { hour: number; count: number }[];
  getHabitHealth: (habitId: string) => number;
  getWeeklySummary: () => WeeklySummary;
  getPaperChainData: (days?: number) => { date: string; complete: boolean; partial: boolean; completionRate: number }[];
  getMoodHabitInsight: () => { habit: string; moodDelta: number; message: string } | null;
  getOverallStats: () => { totalHabits: number; totalCompletions: number; avgStreak: number; longestStreak: number };

  // Modal UI state (not persisted)
  modalCount: number;
  setGlobalModalOpen: (open: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Data export helpers
  getExportData: () => { habits: Habit[]; habitLogs: HabitLog[]; moodLogs: MoodLog[] };
  clearAllData: () => void;
  getJoinDate: () => string;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const getDayOfWeek = (date: Date = new Date()): DayOfWeek => {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

export const useKineticStore = create<KineticState>()(
  persist(
    (set, get) => ({
      userName: 'Your Name',
      userIcon: 'star',
      habits: [],
      habitLogs: [],
      moodLogs: [],
      momentumScore: 50,
      lastDecayDate: null,
      previousWeekMomentum: 50,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,

      addHabit: async (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: generateId(),
          streak: 0,
          bestStreak: 0,
          shieldAvailable: true,
          createdAt: new Date().toISOString(),
          category: habitData.category || 'other',
          icon: habitData.icon || 'star',
          type: habitData.type || 'simple',
          isArchived: false,
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
        await get().syncToCloud();
      },

      deleteHabit: async (habitId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== habitId),
        }));
        await get().syncToCloud();
      },

      updateHabit: async (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h
          ),
        }));
        await get().syncToCloud();
      },

      updateUserProfile: async (userName, userIcon) => {
        set({ userName, userIcon });
        await get().syncToCloud();
      },

      archiveHabit: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, isArchived: true } : h
          ),
        }));
        await get().syncToCloud();
      },

      unarchiveHabit: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, isArchived: false } : h
          ),
        }));
        await get().syncToCloud();
      },

      resetHabitStats: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, streak: 0, bestStreak: 0 } : h
          ),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== habitId),
        }));
        await get().syncToCloud();
      },

      bulkArchive: async (habitIds) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, isArchived: true } : h
          ),
        }));
        await get().syncToCloud();
      },

      bulkUnarchive: async (habitIds) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, isArchived: false } : h
          ),
        }));
        await get().syncToCloud();
      },

      bulkDelete: async (habitIds) => {
        set((state) => ({
          habits: state.habits.filter((h) => !habitIds.includes(h.id)),
          habitLogs: state.habitLogs.filter((l) => !habitIds.includes(l.habitId)),
        }));
        await get().syncToCloud();
      },

      bulkChangeCategory: async (habitIds, category) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, category } : h
          ),
        }));
        await get().syncToCloud();
      },

      logHabitCompletion: async (habitId, value = 1, date) => {
        const state = get();
        const targetDate = date || getDateString();
        
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return;

        const existingLogIndex = state.habitLogs.findIndex(
          (log) => log.habitId === habitId && log.completedAt.startsWith(targetDate)
        );
        
        let logs = [...state.habitLogs];
        
        const wasCompletedBefore = existingLogIndex >= 0 && (state.habitLogs[existingLogIndex].value / habit.target) >= 1;
        const oldValue = existingLogIndex >= 0 ? state.habitLogs[existingLogIndex].value : 0;

        if (existingLogIndex >= 0) {
            // Update existing log
            const existingLog = logs[existingLogIndex];
            logs[existingLogIndex] = { ...existingLog, value };
        } else {
            // New log
            logs.push({
                id: generateId(),
                habitId,
                completedAt: date ? `${date}T12:00:00.000Z` : new Date().toISOString(),
                value,
            });
        }
        
        // Calculate new streak
        const updatedLogValue = value;
        const isNowCompleted = (updatedLogValue / habit.target) >= 1;
        const isCurrentDay = targetDate === getDateString();
        
        let newStreak = habit.streak;
        
        if (isCurrentDay) {
           const baseStreak = wasCompletedBefore ? Math.max(0, habit.streak - 1) : habit.streak;
           
           if (isNowCompleted) {
             newStreak = baseStreak + 1;
           } else {
             newStreak = baseStreak;
           }
        }

        const newBestStreak = Math.max(habit.bestStreak || 0, newStreak);

        // Momentum Logic: Proportional Credit
        const oldPercent = Math.min(1, oldValue / habit.target);
        const newPercent = Math.min(1, updatedLogValue / habit.target);
        const deltaPercent = newPercent - oldPercent;
        const momentumChange = deltaPercent * 5; // 5 points for full completion

        set((state) => ({
            habitLogs: logs,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: newStreak, bestStreak: newBestStreak } : h
            ),
            momentumScore: Math.min(100, Math.max(0, state.momentumScore + momentumChange)),
        }));
        await get().syncToCloud();
      },

      removeHabitCompletion: async (habitId, date) => {
        const state = get();
        const targetDate = date || getDateString();
        
        const logToRemove = state.habitLogs.find(
          (log) => log.habitId === habitId && log.completedAt.startsWith(targetDate)
        );
        
        if (!logToRemove) return;

        const habit = state.habits.find((h) => h.id === habitId);
        if (habit) {
          const isCurrentDay = targetDate === getDateString();
          // If removing, we revert streak if it counted
          const wasCompleted = (logToRemove.value / habit.target) >= 1;
          const newStreak = (isCurrentDay && wasCompleted) ? Math.max(0, habit.streak - 1) : habit.streak;
          
          // Remove proportional momentum
          const percentRemoved = Math.min(1, logToRemove.value / habit.target);
          const momentumChange = percentRemoved * 5;

          set((state) => ({
            habitLogs: state.habitLogs.filter((l) => l.id !== logToRemove.id),
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: newStreak } : h
            ),
            momentumScore: Math.max(0, state.momentumScore - momentumChange),
          }));
          await get().syncToCloud();
        }
      },

      useShield: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, shieldAvailable: false } : h
          ),
        }));
        await get().syncToCloud();
      },

      logMood: async (score, date) => {
        const targetDate = date || getDateString();
        const state = get();
        
        const existingLog = state.moodLogs.find(
          (log) => log.loggedAt.startsWith(targetDate)
        );

        if (existingLog) {
          set((state) => ({
            moodLogs: state.moodLogs.map((log) =>
              log.id === existingLog.id ? { ...log, score } : log
            ),
          }));
        } else {
          const newLog: MoodLog = {
            id: generateId(),
            score,
            loggedAt: date ? `${date}T21:00:00.000Z` : new Date().toISOString(),
          };
          set((state) => ({ moodLogs: [...state.moodLogs, newLog] }));
        }
        await get().syncToCloud();
      },

      syncToCloud: async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isSyncing: true, syncError: null });
        const result = await syncToCloud(user.id, get());
        
        if (result.success) {
          set({ lastSyncedAt: new Date().toISOString(), isSyncing: false });
        } else {
          set({ syncError: (result.error as any)?.message || 'Sync failed', isSyncing: false });
        }
      },

      fetchFromCloud: async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isSyncing: true, syncError: null });
        const result = await fetchFromCloud(user.id);
        
        if (result.success && result.data) {
          set({
            habits: result.data.habits,
            habitLogs: result.data.habitLogs,
            moodLogs: result.data.moodLogs,
            userName: result.data.profile?.userName || get().userName,
            userIcon: result.data.profile?.userIcon || get().userIcon,
            theme: result.data.profile?.theme || get().theme,
            lastSyncedAt: new Date().toISOString(),
            isSyncing: false
          });
        } else {
          set({ syncError: (result.error as any)?.message || 'Fetch failed', isSyncing: false });
        }
      },

      initializeStore: async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await get().fetchFromCloud();
        }
      },

      calculateMomentumScore: () => {
        const state = get();
        const today = new Date();
        const dayOfWeek = getDayOfWeek(today);
        
        const todaysHabits = state.habits.filter((h) =>
          h.schedule.includes(dayOfWeek)
        );

        if (todaysHabits.length === 0) return state.momentumScore;

        const todayString = getDateString(today);
        
        // Calculate weighted completion rate
        let totalWeightedCompletion = 0;
        
        todaysHabits.forEach((h) => {
            const log = state.habitLogs.find(
                (l) => l.habitId === h.id && l.completedAt.startsWith(todayString)
            );
            if (log) {
                const percent = Math.min(1, log.value / h.target);
                totalWeightedCompletion += percent;
            }
        });

        const completionRate = totalWeightedCompletion / todaysHabits.length;
        
        // Projection logic based on streaks
        let score = state.momentumScore;
        const avgStreak = state.habits.reduce((sum, h) => sum + h.streak, 0) / 
          (state.habits.length || 1);
        
        score += Math.min(avgStreak * 2, 20);

        return Math.round(Math.min(100, Math.max(0, score)));
      },

      applyDailyDecay: () => {
        const state = get();
        const today = getDateString();
        
        if (state.lastDecayDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = getDateString(yesterday);
        const dayOfWeek = getDayOfWeek(yesterday);

        const missedHabits = state.habits.filter((habit) => {
          if (!habit.schedule.includes(dayOfWeek)) return false;
          
          const log = state.habitLogs.find(
            (log) => log.habitId === habit.id && log.completedAt.startsWith(yesterdayString)
          );
          
          if (!log) return true; // Missed completely

          // Partial completion sustain logic
          const percent = (log.value / habit.target) * 100;
          return percent < 50; // Missed if < 50%
        });

        const decayAmount = missedHabits.length * 3;
        
        const updatedHabits = state.habits.map((habit) => {
          if (missedHabits.find((m) => m.id === habit.id)) {
             // Reset streak if missed (and < 50%)
            return { ...habit, streak: 0 };
          }
          return habit;
        });

        set({
          momentumScore: Math.max(0, state.momentumScore - decayAmount),
          habits: updatedHabits,
          lastDecayDate: today,
        });
      },

      getHabitProgress: (habitId, date) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { current: 0, target: 1, percent: 0 };
        
        const log = state.habitLogs.find(
          (l) => l.habitId === habitId && l.completedAt.startsWith(date)
        );
        
        const current = log ? log.value : 0;
        const percent = Math.min(100, (current / habit.target) * 100);
        
        return { current, target: habit.target, percent };
      },

      getTodaysMood: () => {
        const state = get();
        const today = getDateString();
        const todayLog = state.moodLogs.find((log) =>
          log.loggedAt.startsWith(today)
        );
        return todayLog?.score ?? null;
      },

      getMoodOnDate: (date) => {
        const state = get();
        const moodLog = state.moodLogs.find((log) =>
          log.loggedAt.startsWith(date)
        );
        return moodLog?.score ?? null;
      },

      isHabitCompletedToday: (habitId) => {
        const state = get();
        const today = getDateString();
        const habit = state.habits.find((h) => h.id === habitId);
        const log = state.habitLogs.find(
          (log) => log.habitId === habitId && log.completedAt.startsWith(today)
        );
        return log && habit ? (log.value / habit.target) >= 1 : false;
      },

      isHabitCompletedOnDate: (habitId, date) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        const log = state.habitLogs.find(
          (log) => log.habitId === habitId && log.completedAt.startsWith(date)
        );
        return log && habit ? (log.value / habit.target) >= 1 : false;
      },

      getHabitLogsForDate: (habitId, date) => {
        const state = get();
        return state.habitLogs.filter(
          (log) => log.habitId === habitId && log.completedAt.startsWith(date)
        );
      },

      getWeeklyHabitData: (habitId) => {
        const state = get();
        const data = [];
        const habit = state.habits.find((h) => h.id === habitId);
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const log = state.habitLogs.find(
            (log) => log.habitId === habitId && log.completedAt.startsWith(dateString)
          );
          const completed = log && habit ? (log.value / habit.target) >= 1 : false;
          data.push({ date: dateString, completed });
        }
        return data;
      },

      getYearlyHabitData: (habitId) => {
        const state = get();
        const data = [];
        for (let i = 364; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const count = state.habitLogs.filter(
            (log) => log.habitId === habitId && log.completedAt.startsWith(dateString)
          ).length;
          data.push({ date: dateString, count });
        }
        return data;
      },

      getMoodCorrelationData: () => {
        const state = get();
        const data: { date: string; mood: number; completionRate: number }[] = [];
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const dayOfWeek = getDayOfWeek(date);
          
          const moodLog = state.moodLogs.find((log) =>
            log.loggedAt.startsWith(dateString)
          );
          
          const scheduledHabits = state.habits.filter((h) =>
            h.schedule.includes(dayOfWeek)
          );
          
          if (scheduledHabits.length > 0) {
            let totalWeightedCompletion = 0;
            
            scheduledHabits.forEach(h => {
                const log = state.habitLogs.find(
                    (l) => l.habitId === h.id && l.completedAt.startsWith(dateString)
                );
                if (log) {
                    totalWeightedCompletion += Math.min(1, log.value / h.target);
                }
            });
            
            const completionRate = (totalWeightedCompletion / scheduledHabits.length) * 100;
            
            if (moodLog) {
              data.push({
                date: dateString,
                mood: moodLog.score * 10,
                completionRate,
              });
            }
          }
        }
        
        return data;
      },

      // New Trends selectors
      getTotalVolume: () => {
        const state = get();
        return state.habits.map((habit) => {
          const total = state.habitLogs
            .filter((log) => log.habitId === habit.id)
            .reduce((sum, log) => sum + log.value, 0);
          return {
            habitId: habit.id,
            name: habit.name,
            total: total,
            unit: habit.unit,
          };
        });
      },

      getBestStreak: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        return habit?.bestStreak || 0;
      },

      getDayOfWeekEfficiency: () => {
        const state = get();
        const daysOrder: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        return daysOrder.map((day) => {
          let totalScheduled = 0;
          let totalCompletionValue = 0;
          
          // Look back 12 weeks
          for (let week = 0; week < 12; week++) {
            const date = new Date();
            const currentDayIndex = date.getDay();
            const targetDayIndex = daysOrder.indexOf(day) + 1; // +1 because Sun=0 in JS
            const diff = targetDayIndex - currentDayIndex - (week * 7);
            date.setDate(date.getDate() + diff);
            
            if (date > new Date()) continue;
            
            const dateString = getDateString(date);
            
            state.habits.forEach((habit) => {
              if (habit.schedule.includes(day)) {
                totalScheduled++;
                const log = state.habitLogs.find(
                  (log) => log.habitId === habit.id && log.completedAt.startsWith(dateString)
                );
                if (log) {
                    // Use weighted completion
                    totalCompletionValue += Math.min(1, log.value / habit.target);
                }
              }
            });
          }
          
          return {
            day,
            rate: totalScheduled > 0 ? (totalCompletionValue / totalScheduled) * 100 : 0,
            total: totalScheduled,
            completed: Math.round(totalCompletionValue), // approx
          };
        });
      },

      getTimeOfDayPerformance: () => {
        const state = get();
        const hourCounts: { [key: number]: number } = {};
        
        // Initialize all hours
        for (let i = 0; i < 24; i++) {
          hourCounts[i] = 0;
        }
        
        state.habitLogs.forEach((log) => {
          const hour = new Date(log.completedAt).getHours();
          hourCounts[hour]++;
        });
        
        return Object.entries(hourCounts).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }));
      },

      getHabitHealth: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return 0;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        const habitCreatedAt = new Date(habit.createdAt);
        habitCreatedAt.setHours(0, 0, 0, 0);

        // Last 7 days, weighted by recency
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          if (date < habitCreatedAt) continue; // Ignore days before habit was created
          
          const dayOfWeek = getDayOfWeek(date);
          
          if (!habit.schedule.includes(dayOfWeek)) continue;
          
          const weight = 7 - i; // Day 0 (today) = 7, Day 6 = 1
          totalWeight += weight;
          
          const log = state.habitLogs.find(
            (log) => log.habitId === habit.id && log.completedAt.startsWith(getDateString(date))
          );
          
          if (log) {
            const completionPercent = Math.min(1, log.value / habit.target);
            weightedSum += (weight * completionPercent);
          }
        }
        
        return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 100;
      },

      getWeeklySummary: () => {
        const state = get();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        // Get completions this week
        const weekLogs = state.habitLogs.filter(
          (log) => new Date(log.completedAt) >= weekAgo
        );
        
        // Count by habit (weighted?)
        // For summary "Top Habit", maybe full completions or just total value?
        // Let's stick to simple "number of days interacted with" for now or sum of completion rates?
        // Let's use count of logs for simplicity
        const habitCounts: { [key: string]: number } = {};
        weekLogs.forEach((log) => {
          habitCounts[log.habitId] = (habitCounts[log.habitId] || 0) + 1;
        });
        
        // Find top habit
        let topHabit: { name: string; completions: number } | null = null;
        let maxCompletions = 0;
        
        Object.entries(habitCounts).forEach(([habitId, count]) => {
          if (count > maxCompletions) {
            const habit = state.habits.find((h) => h.id === habitId);
            if (habit) {
              topHabit = { name: habit.name, completions: count };
              maxCompletions = count;
            }
          }
        });
        
        // Calculate completion rate for the week
        let totalScheduled = 0;
        let totalCompletedValue = 0;
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const dayOfWeek = getDayOfWeek(date);
          
          state.habits.forEach((habit) => {
            if (habit.schedule.includes(dayOfWeek)) {
              totalScheduled++;
              const log = state.habitLogs.find(
                (log) => log.habitId === habit.id && log.completedAt.startsWith(dateString)
              );
              if (log) {
                  totalCompletedValue += Math.min(1, log.value / habit.target);
              }
            }
          });
        }
        
        // Calculate average mood
        const weekMoods = state.moodLogs.filter(
          (log) => new Date(log.loggedAt) >= weekAgo
        );
        const avgMood = weekMoods.length > 0
          ? weekMoods.reduce((sum, log) => sum + log.score, 0) / weekMoods.length
          : null;
        
        return {
          topHabit,
          totalCompletions: weekLogs.length,
          completionRate: totalScheduled > 0 ? (totalCompletedValue / totalScheduled) * 100 : 0,
          momentumChange: state.momentumScore - state.previousWeekMomentum,
          avgMood,
        };
      },

      getPaperChainData: (days = 30) => {
        const state = get();
        const data: { date: string; complete: boolean; partial: boolean; completionRate: number }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateString = getDateString(date);
          const dayOfWeek = getDayOfWeek(date);
          
          const scheduledHabits = state.habits.filter((h) => {
            const habitCreatedDate = new Date(h.createdAt);
            habitCreatedDate.setHours(0, 0, 0, 0);
            return h.schedule.includes(dayOfWeek) && habitCreatedDate <= date;
          });
          
          if (scheduledHabits.length === 0) {
            // If it's the future, don't mark as complete/100%
            if (date > today) {
              data.push({ date: dateString, complete: false, partial: false, completionRate: 0 });
            } else {
              data.push({ date: dateString, complete: true, partial: false, completionRate: 100 });
            }
            continue;
          }
          
          let totalCompletion = 0;
          
          scheduledHabits.forEach((habit) => {
             const log = state.habitLogs.find(
                 (l) => l.habitId === habit.id && l.completedAt.startsWith(dateString)
             );
             if (log) {
                 totalCompletion += Math.min(1, log.value / habit.target);
             }
          });
          
          const rate = (totalCompletion / scheduledHabits.length) * 100;
          
          data.push({
            date: dateString,
            complete: rate === 100,
            partial: rate > 0 && rate < 100,
            completionRate: rate,
          });
        }
        
        return data;
      },

      getMoodHabitInsight: () => {
        const state = get();
        if (state.moodLogs.length < 7 || state.habits.length === 0) return null;
        
        // For each habit, calculate average mood on completion days vs non-completion days
        let bestInsight: { habit: string; moodDelta: number; message: string } | null = null;
        let maxDelta = 0;
        
        state.habits.forEach((habit) => {
          const completionDates = new Set(
            state.habitLogs
              .filter((log) => log.habitId === habit.id && (log.value / habit.target) >= 0.5) // Consider meaningful interaction
              .map((log) => log.completedAt.split('T')[0])
          );
          
          let completionMoodSum = 0;
          let completionMoodCount = 0;
          let nonCompletionMoodSum = 0;
          let nonCompletionMoodCount = 0;
          
          state.moodLogs.forEach((moodLog) => {
            const moodDate = moodLog.loggedAt.split('T')[0];
            if (completionDates.has(moodDate)) {
              completionMoodSum += moodLog.score;
              completionMoodCount++;
            } else {
              nonCompletionMoodSum += moodLog.score;
              nonCompletionMoodCount++;
            }
          });
          
          if (completionMoodCount > 0 && nonCompletionMoodCount > 0) {
            const avgCompletionMood = completionMoodSum / completionMoodCount;
            const avgNonCompletionMood = nonCompletionMoodSum / nonCompletionMoodCount;
            const delta = avgCompletionMood - avgNonCompletionMood;
            
            if (Math.abs(delta) > maxDelta) {
              maxDelta = Math.abs(delta);
              const deltaRounded = Math.round(delta * 10) / 10;
              bestInsight = {
                habit: habit.name,
                moodDelta: deltaRounded,
                message: delta > 0
                  ? `Your mood is ${deltaRounded.toFixed(1)} points higher on days you complete "${habit.name}"`
                  : `Consider adjusting "${habit.name}" - it may be causing stress`,
              };
            }
          }
        });
        
        return bestInsight;
      },

      getOverallStats: () => {
        const state = get();
        const streaks = state.habits.map((h) => h.streak);
        const bestStreaks = state.habits.map((h) => h.bestStreak || 0);
        
        return {
          totalHabits: state.habits.length,
          totalCompletions: state.habitLogs.length,
          avgStreak: streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0,
          longestStreak: bestStreaks.length > 0 ? Math.max(...bestStreaks) : 0,
        };
      },

      modalCount: 0,
      setGlobalModalOpen: (open) => set((state) => ({ 
        modalCount: Math.max(0, state.modalCount + (open ? 1 : -1)) 
      })),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      getExportData: () => {
        const state = get();
        return {
          habits: state.habits,
          habitLogs: state.habitLogs,
          moodLogs: state.moodLogs,
        };
      },

      clearAllData: () => {
        set({
          habits: [],
          habitLogs: [],
          moodLogs: [],
          momentumScore: 50,
          lastDecayDate: null,
          previousWeekMomentum: 50,
        });
      },

      getJoinDate: () => {
        const state = get();
        if (state.habits.length === 0) return 'Recently joined';
        const oldestHabit = state.habits.reduce((oldest, habit) => 
          new Date(habit.createdAt) < new Date(oldest.createdAt) ? habit : oldest
        );
        return new Date(oldestHabit.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      },
    }),
    {
      name: 'kinetic-storage',
      partialize: (state) => {
        const { modalCount, ...rest } = state;
        return rest;
      },
      // Migration to add new fields to existing habits
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.userName = state.userName ?? 'Your Name';
          state.userIcon = state.userIcon ?? 'star';
          state.habits = state.habits.map((habit) => ({
            ...habit,
            bestStreak: habit.bestStreak ?? habit.streak,
            category: habit.category ?? 'other',
            icon: habit.icon ?? 'star',
            type: habit.type ?? 'simple',
            isArchived: habit.isArchived ?? false,
          }));
        }
      },
    }
  )
);
