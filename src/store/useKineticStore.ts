import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase';
import { 
  getAllUserData, 
  updateProfile, 
  batchUpsert,
  deleteAllUserData,
  UserProfile 
} from '@/lib/firestore';

import { MOMENTUM_CONSTANTS } from '@/lib/constants';
import { getLocalDateKey, daysBetween, addDays } from '@/lib/dateUtils';
import { getCompletionStatus } from '@/lib/completionUtils';
import { calculateMomentumChange } from '@/lib/momentumUtils';

// Simple debounce helper
const debounce = (fn: Function, ms = 2000) => {
  let timeoutId: any;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), ms);
  };
};

// Define outside to persist across store updates
const debouncedSyncFn = debounce(async (get: any) => {
  await get().syncToFirestore();
}, 2000);

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
  createdAt: string;
  deletedAt?: string;
  category: HabitCategory;
  icon: HabitIcon;
  isArchived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string;
  value: number;
  deletedAt?: string;
}

export interface MoodLog {
  id: string;
  score: number;
  loggedAt: string;
  deletedAt?: string;
}

export interface SkipLog {
  id: string;
  habitId: string;
  dateKey: string; // YYYY-MM-DD
  reason?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface WeeklyContractStatus {
  target: number | null;
  completed: number;
  totalScheduled: number;
  remaining: number;
  isMet: boolean;
}

export interface WeeklySummary {
  topHabit: { name: string; completions: number } | null;
  totalCompletions: number;
  completionRate: number;
  momentumChange: number;
  avgMood: number | null;
  contract: WeeklyContractStatus;
}

export type Theme = 'light' | 'dark';

interface KineticState {
  // User data
  userName: string;
  userIcon: HabitIcon;
  habits: Habit[];
  habitLogs: HabitLog[];
  moodLogs: MoodLog[];
  skipLogs: SkipLog[];
  weeklyContractTarget: number | null;
  selectedDate: string; // YYYY-MM-DD
  
  // Computed
  momentumScore: number;
  lastDecayDate: string | null;
  previousWeekMomentum: number;
  
  // Sync state
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
  
  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'createdAt' | 'isArchived' | 'category' | 'icon' | 'type' | 'deletedAt'> & Partial<Pick<Habit, 'category' | 'icon' | 'type'>>) => Promise<void>;
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
  logHabitCompletion: (habitId: string, value?: number, dateKey?: string) => Promise<void>;
  removeHabitCompletion: (habitId: string, dateKey?: string) => Promise<void>;
  logMood: (score: number, dateKey?: string) => Promise<void>;
  logSkip: (habitId: string, dateKey: string, reason?: string) => Promise<void>;
  removeSkip: (habitId: string, dateKey: string) => Promise<void>;
  setWeeklyContractTarget: (target: number | null) => void;
  setSelectedDate: (dateKey: string) => void;
  
  // Cloud sync actions
  syncToFirestore: () => Promise<void>;
  fetchFromCloud: (forcePushIfEmpty?: boolean) => Promise<void>;
  initializeStore: () => Promise<void>;

  calculateMomentumScore: () => number;
  applyDailyDecay: () => void;
  getHabitProgress: (habitId: string, dateKey: string) => { current: number; target: number; percent: number };
  getTodaysMood: () => number | null;
  getMoodOnDate: (dateKey: string) => number | null;
  isHabitCompletedToday: (habitId: string) => boolean;
  isHabitCompletedOnDate: (habitId: string, dateKey: string) => boolean;
  getHabitLogsForDate: (habitId: string, dateKey: string) => HabitLog[];
  getWeeklyHabitData: (habitId: string) => { date: string; completed: boolean }[];
  getYearlyHabitData: (habitId: string) => { date: string; count: number }[];
  getMoodCorrelationData: () => { date: string; mood: number; completionRate: number }[];
  getWeeklyContractStatus: () => WeeklyContractStatus;
  
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
  getExportData: () => { habits: Habit[]; habitLogs: HabitLog[]; moodLogs: MoodLog[]; skipLogs: SkipLog[]; weeklyContractTarget: number | null };
  clearAllData: () => Promise<void>;
  getJoinDate: () => string;
  updateWeeklyMomentum: () => void;
  loadDemoData: () => Promise<void>;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getDateString = (date: Date = new Date()) => {
  return getLocalDateKey(date);
};

function buildLogIndex(logs: HabitLog[]): Map<string, HabitLog> {
  const m = new Map<string, HabitLog>();
  for (const log of logs.filter((l) => !l.deletedAt)) {
    const dateKey = log.completedAt.includes('T') ? log.completedAt.split('T')[0] : log.completedAt;
    m.set(`${log.habitId}:${dateKey}`, log);
  }
  return m;
}

function buildSkipIndex(skips: SkipLog[]): Map<string, SkipLog> {
  const m = new Map<string, SkipLog>();
  for (const s of skips.filter((l) => !l.deletedAt)) {
    m.set(`${s.habitId}:${s.dateKey}`, s);
  }
  return m;
}

const getDayOfWeek = (date: Date = new Date()): DayOfWeek => {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()] ?? 'Mon';
};

// Helper function to recalculate streak and best streak for a habit
const recalculateStreak = (habit: Habit, habitLogs: HabitLog[], skipLogs: SkipLog[], upToDate?: string): { streak: number; bestStreak: number } => {
  const today = new Date();
  const endDate = upToDate ? new Date(upToDate.includes('T') ? upToDate : upToDate + 'T23:59:59') : today;
  endDate.setHours(23, 59, 59, 999);
  
  const parseDate = (dStr: string) => {
    if (dStr.includes('T')) return new Date(dStr);
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };

  const habitCreatedAt = parseDate(habit.createdAt);
  habitCreatedAt.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  // Iterate from habit creation date to end date (or today)
  const startDate = habitCreatedAt > endDate ? endDate : habitCreatedAt;
  const checkDate = new Date(startDate);
  
  while (checkDate <= endDate) {
    const dateString = getLocalDateKey(checkDate);
    
    const log = habitLogs.find(
      (l) => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(dateString)
    );
    const skipLog = skipLogs.find(
      (l) => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateString
    );
    
    const status = getCompletionStatus(log, skipLog, habit, dateString);
    
    if (status === 'complete' || status === 'skipped') {
      if (status === 'complete') {
        tempStreak++;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      
      // Current streak is the streak ending at the end date
      if (dateString === getLocalDateKey(endDate) || (upToDate && dateString === upToDate)) {
        currentStreak = tempStreak;
      }
    } else if (status === 'partial' || status === 'missed') {
      tempStreak = 0;
      currentStreak = 0;
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  if (currentStreak === 0 && !upToDate) {
    const recentDate = new Date(endDate);
    recentDate.setDate(recentDate.getDate() - 7); // Look back 7 days
    
    while (recentDate <= endDate) {
      const dateString = getLocalDateKey(recentDate);
      
      const log = habitLogs.find(
        (l) => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(dateString)
      );
      const skipLog = skipLogs.find(
        (l) => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateString
      );
      
      const status = getCompletionStatus(log, skipLog, habit, dateString);
      
      if ((status === 'complete' || status === 'skipped') && tempStreak > 0) {
        let streakCount = 0;
        let checkBackDate = new Date(recentDate);
        
        while (checkBackDate >= habitCreatedAt) {
          const backDateString = getLocalDateKey(checkBackDate);
          
          const bLog = habitLogs.find(
            (l) => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(backDateString)
          );
          const bSkipLog = skipLogs.find(
            (l) => !l.deletedAt && l.habitId === habit.id && l.dateKey === backDateString
          );
          
          const bStatus = getCompletionStatus(bLog, bSkipLog, habit, backDateString);
          
          if (bStatus === 'complete') {
            streakCount++;
            checkBackDate.setDate(checkBackDate.getDate() - 1);
          } else if (bStatus === 'skipped' || bStatus === 'not-scheduled') {
            checkBackDate.setDate(checkBackDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        currentStreak = streakCount;
        break;
      }
      
      recentDate.setDate(recentDate.getDate() + 1);
    }
  }
  
  return {
    streak: currentStreak,
    bestStreak: Math.max(habit.bestStreak || 0, maxStreak)
  };
};

export const useKineticStore = create<KineticState>()(
  persist(
    (set, get) => ({
      userName: 'Your Name',
      userIcon: 'star',
      habits: [],
      habitLogs: [],
      moodLogs: [],
      skipLogs: [],
      weeklyContractTarget: null,
      selectedDate: getLocalDateKey(),
      momentumScore: MOMENTUM_CONSTANTS.INITIAL_SCORE,
      lastDecayDate: null,
      previousWeekMomentum: MOMENTUM_CONSTANTS.INITIAL_SCORE,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,

      addHabit: async (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: generateId(),
          streak: 0,
          bestStreak: 0,
          createdAt: getLocalDateKey(),
          category: habitData.category || 'other',
          icon: habitData.icon || 'star',
          type: habitData.type || 'simple',
          isArchived: false,
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
        debouncedSyncFn(get);
      },

      deleteHabit: async (habitId) => {
        const now = new Date().toISOString();
        set((state) => ({
          habits: state.habits.map((h) => h.id === habitId ? { ...h, deletedAt: now } : h),
          habitLogs: state.habitLogs.map((l) => l.habitId === habitId ? { ...l, deletedAt: now } : l),
          skipLogs: state.skipLogs.map((l) => l.habitId === habitId ? { ...l, deletedAt: now } : l),
        }));
        debouncedSyncFn(get);
      },

      updateHabit: async (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      updateUserProfile: async (userName, userIcon) => {
        set({ userName, userIcon });
        debouncedSyncFn(get);
      },

      archiveHabit: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, isArchived: true } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      unarchiveHabit: async (habitId) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, isArchived: false } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      resetHabitStats: async (habitId) => {
        const now = new Date().toISOString();
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, streak: 0, bestStreak: 0 } : h
          ),
          habitLogs: state.habitLogs.map((l) => l.habitId === habitId ? { ...l, deletedAt: now } : l),
          skipLogs: state.skipLogs.map((l) => l.habitId === habitId ? { ...l, deletedAt: now } : l),
        }));
        debouncedSyncFn(get);
      },

      bulkArchive: async (habitIds) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, isArchived: true } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      bulkUnarchive: async (habitIds) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, isArchived: false } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      bulkDelete: async (habitIds) => {
        const now = new Date().toISOString();
        set((state) => ({
          habits: state.habits.map((h) => habitIds.includes(h.id) ? { ...h, deletedAt: now } : h),
          habitLogs: state.habitLogs.map((l) => habitIds.includes(l.habitId) ? { ...l, deletedAt: now } : l),
          skipLogs: state.skipLogs.map((l) => habitIds.includes(l.habitId) ? { ...l, deletedAt: now } : l),
        }));
        debouncedSyncFn(get);
      },

      bulkChangeCategory: async (habitIds, category) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            habitIds.includes(h.id) ? { ...h, category } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      logHabitCompletion: async (habitId, value = 1, dateKey) => {
        set((state) => {
          const targetDateKey = dateKey || state.selectedDate;
          const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
          if (!habit) return state;

          const logs = state.habitLogs.filter((l) => !l.deletedAt);
          const existingLogIndex = state.habitLogs.findIndex(
            (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(targetDateKey)
          );
          const existingLog = existingLogIndex >= 0 ? state.habitLogs[existingLogIndex] : undefined;
          const oldValue = existingLog ? existingLog.value : 0;

          let newLogs: HabitLog[];
          if (existingLogIndex >= 0 && existingLog) {
            newLogs = state.habitLogs.map((l, idx) =>
              idx === existingLogIndex ? { ...l, value } : l
            );
          } else {
            const newLog: HabitLog = {
              id: generateId(),
              habitId,
              completedAt: targetDateKey === getLocalDateKey()
                ? `${targetDateKey}T${new Date().toLocaleTimeString('sv')}`
                : `${targetDateKey}T12:00:00`,
              value,
            };
            newLogs = [...state.habitLogs, newLog];
          }

          const streakData = recalculateStreak(habit, newLogs, state.skipLogs, targetDateKey);
          const oldPercent = Math.min(1, oldValue / habit.target);
          const newPercent = Math.min(1, value / habit.target);
          const momentumChange = calculateMomentumChange(newPercent, false) - calculateMomentumChange(oldPercent, false);

          return {
            habitLogs: newLogs,
            skipLogs: state.skipLogs.map((l) =>
              (l.habitId === habitId && l.dateKey === targetDateKey) ? { ...l, deletedAt: new Date().toISOString() } : l
            ),
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: streakData.streak, bestStreak: streakData.bestStreak } : h
            ),
            momentumScore: Math.min(MOMENTUM_CONSTANTS.MAX_SCORE, Math.max(MOMENTUM_CONSTANTS.MIN_SCORE, state.momentumScore + momentumChange)),
          };
        });
        debouncedSyncFn(get);
      },

      removeHabitCompletion: async (habitId, dateKey) => {
        set((state) => {
          const targetDateKey = dateKey || state.selectedDate;
          const logToRemoveIndex = state.habitLogs.findIndex(
            (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(targetDateKey)
          );
          if (logToRemoveIndex === -1) return state;

          const logToRemove = state.habitLogs[logToRemoveIndex];
          if (!logToRemove) return state;
          const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
          if (!habit) return state;

          const now = new Date().toISOString();
          const updatedLogs = state.habitLogs.map((l, idx) =>
            idx === logToRemoveIndex ? { ...l, deletedAt: now } : l
          );
          const streakData = recalculateStreak(habit, updatedLogs, state.skipLogs, targetDateKey);
          const percentRemoved = Math.min(1, logToRemove.value / habit.target);
          const momentumChange = calculateMomentumChange(percentRemoved, false);

          return {
            habitLogs: updatedLogs,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: streakData.streak, bestStreak: streakData.bestStreak } : h
            ),
            momentumScore: Math.max(MOMENTUM_CONSTANTS.MIN_SCORE, state.momentumScore - momentumChange),
          };
        });
        debouncedSyncFn(get);
      },

      logMood: async (score, dateKey) => {
        const targetDateKey = dateKey || get().selectedDate;
        const state = get();
        
        const existingLog = state.moodLogs.find(
          (log) => !log.deletedAt && log.loggedAt.startsWith(targetDateKey)
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
            loggedAt: targetDateKey === getLocalDateKey()
              ? `${targetDateKey}T${new Date().toLocaleTimeString('sv')}`
              : `${targetDateKey}T21:00:00`,
          };
          set((state) => ({ moodLogs: [...state.moodLogs, newLog] }));
        }
        debouncedSyncFn(get);
      },

      logSkip: async (habitId, dateKey, reason) => {
        set((state) => {
          const targetDateKey = dateKey || state.selectedDate;
          const now = new Date().toISOString();
          const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
          if (!habit) return state;

          const existingSkip = state.skipLogs.find(
            (l) => !l.deletedAt && l.habitId === habitId && l.dateKey === targetDateKey
          );
          if (existingSkip) {
            return {
              skipLogs: state.skipLogs.map((l) =>
                l.id === existingSkip.id ? { ...l, reason } : l
              ),
            };
          }

          const newSkip: SkipLog = {
            id: generateId(),
            habitId,
            dateKey: targetDateKey,
            reason,
            createdAt: now,
          };

          const updatedHabitLogs = state.habitLogs.map((l) =>
            !l.deletedAt && l.habitId === habitId && l.completedAt.startsWith(targetDateKey)
              ? { ...l, deletedAt: now }
              : l
          );

          const streakData = recalculateStreak(habit, updatedHabitLogs, [...state.skipLogs, newSkip], targetDateKey);

          return {
            skipLogs: [...state.skipLogs, newSkip],
            habitLogs: updatedHabitLogs,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: streakData.streak, bestStreak: streakData.bestStreak } : h
            ),
          };
        });
        debouncedSyncFn(get);
      },

      removeSkip: async (habitId, dateKey) => {
        const state = get();
        const targetDateKey = dateKey || state.selectedDate;
        const now = new Date().toISOString();

        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return;

        const existingSkip = state.skipLogs.find(
          (l) => !l.deletedAt && l.habitId === habitId && l.dateKey === targetDateKey
        );
        if (!existingSkip) return;

        const updatedSkipLogs = state.skipLogs.map((l) => 
          (l.id === existingSkip.id) ? { ...l, deletedAt: now } : l
        );

        const streakData = recalculateStreak(habit, state.habitLogs, updatedSkipLogs, targetDateKey);

        set((state) => ({
          skipLogs: updatedSkipLogs,
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, streak: streakData.streak, bestStreak: streakData.bestStreak } : h
          ),
        }));
        debouncedSyncFn(get);
      },

      setWeeklyContractTarget: (target) => {
        set({ weeklyContractTarget: target });
        debouncedSyncFn(get);
      },

      setSelectedDate: (selectedDate) => set({ selectedDate }),

      syncToFirestore: async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        set({ isSyncing: true, syncError: null });
        try {
          const state = get();
          
          // 1. Sync profile document
          await updateProfile(user.uid, {
            userName: state.userName,
            userIcon: state.userIcon,
            weeklyContractTarget: state.weeklyContractTarget,
            momentumScore: state.momentumScore,
            lastDecayDate: state.lastDecayDate,
            previousWeekMomentum: state.previousWeekMomentum,
          });

          // 2. Batch upsert collections (includes soft-deleted items)
          await Promise.all([
            batchUpsert(user.uid, 'habits', state.habits),
            batchUpsert(user.uid, 'habit_logs', state.habitLogs),
            batchUpsert(user.uid, 'mood_logs', state.moodLogs),
            batchUpsert(user.uid, 'skip_logs', state.skipLogs),
          ]);
          
          set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
        } catch (error: any) {
          console.error('Firestore sync error:', error);
          set({ isSyncing: false, syncError: error.message });
        }
      },

      fetchFromCloud: async (forcePushIfEmpty = false) => {
        const user = auth.currentUser;
        if (!user) return;

        set({ isSyncing: true, syncError: null });
        try {
          const data = await getAllUserData(user.uid);

          if (data.profile || data.habits.length > 0 || data.habitLogs.length > 0 || data.moodLogs.length > 0 || data.skipLogs.length > 0) {
            set({
              userName: data.profile?.userName ?? get().userName,
              userIcon: data.profile?.userIcon ?? get().userIcon,
              habits: data.habits,
              habitLogs: data.habitLogs,
              moodLogs: data.moodLogs,
              skipLogs: data.skipLogs,
              weeklyContractTarget: data.profile?.weeklyContractTarget ?? get().weeklyContractTarget,
              momentumScore: data.profile?.momentumScore ?? get().momentumScore,
              lastDecayDate: data.profile?.lastDecayDate ?? get().lastDecayDate,
              previousWeekMomentum: data.profile?.previousWeekMomentum ?? get().previousWeekMomentum,
              lastSyncedAt: data.profile?.lastSyncedAt ?? get().lastSyncedAt,
              isSyncing: false,
            });
          } else if (forcePushIfEmpty && (get().habits.length > 0 || get().habitLogs.length > 0)) {
            // If cloud is empty but local has data, push local to cloud
            await get().syncToFirestore();
          } else {
            set({ isSyncing: false });
          }
        } catch (error: any) {
          console.error('Firestore fetch error:', error);
          set({ isSyncing: false, syncError: error.message });
        }
      },

      initializeStore: async () => {
        // Hydrate from cloud if user is logged in
        const user = auth.currentUser;
        if (user) {
          await get().fetchFromCloud(true);
        }
        // Apply daily decay
        get().applyDailyDecay();
      },

      calculateMomentumScore: () => {
        const state = get();
        const today = new Date();
        const dayOfWeek = getDayOfWeek(today);
        
        const todaysHabits = state.habits.filter((h) =>
          !h.deletedAt && h.schedule.includes(dayOfWeek)
        );

        if (todaysHabits.length === 0) return state.momentumScore;

        const todayString = getDateString(today);
        
        // Calculate weighted completion rate
        let totalWeightedCompletion = 0;
        
        todaysHabits.forEach((h) => {
            const log = state.habitLogs.find(
                (l) => !l.deletedAt && l.habitId === h.id && l.completedAt.startsWith(todayString)
            );
            const skipLog = state.skipLogs.find(
                (l) => !l.deletedAt && l.habitId === h.id && l.dateKey === todayString
            );
            const status = getCompletionStatus(log, skipLog, h, todayString);
            
            if (status === 'complete' || status === 'skipped') {
                totalWeightedCompletion += 1;
            } else if (status === 'partial' && log) {
                totalWeightedCompletion += Math.min(1, log.value / h.target);
            }
        });

        const completionRate = totalWeightedCompletion / todaysHabits.length;
        
        // Projection logic based on streaks
        let score = state.momentumScore;
        const activeHabits = state.habits.filter(h => !h.deletedAt);
        const avgStreak = activeHabits.reduce((sum, h) => sum + h.streak, 0) / 
          (activeHabits.length || 1);
        
        score += Math.min(avgStreak * 2, 20);

        return Math.round(Math.min(100, Math.max(0, score)));
      },

      applyDailyDecay: () => {
        const state = get();
        const today = getDateString();
        const lastDecayDate = state.lastDecayDate ?? addDays(today, -1);

        if (state.lastDecayDate === today) return;

        const daysSinceDecay = Math.max(0, daysBetween(lastDecayDate, today));
        if (daysSinceDecay === 0) {
          set({ lastDecayDate: today });
          return;
        }

        let totalPenalty = 0;
        const habitsToResetStreak = new Set<string>();

        for (let i = 1; i <= daysSinceDecay; i++) {
          const dateKey = addDays(lastDecayDate, i);
          const dayOfWeek = getDayOfWeek(new Date(dateKey + 'T12:00:00'));

          const missedHabits = state.habits.filter((habit) => {
            if (habit.deletedAt || !habit.schedule.includes(dayOfWeek)) return false;
            const log = state.habitLogs.find(
              (l) => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(dateKey)
            );
            const skipLog = state.skipLogs.find(
              (l) => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateKey
            );
            const status = getCompletionStatus(log, skipLog, habit, dateKey);
            return status === 'missed';
          });

          totalPenalty += missedHabits.reduce((sum) => sum + Math.abs(calculateMomentumChange(0, true)), 0);
          totalPenalty += MOMENTUM_CONSTANTS.DAILY_DECAY;
          missedHabits.forEach((h) => habitsToResetStreak.add(h.id));
        }

        const updatedHabits = state.habits.map((habit) => {
          if (habit.deletedAt) return habit;
          if (habitsToResetStreak.has(habit.id)) return { ...habit, streak: 0 };
          return habit;
        });

        set({
          momentumScore: Math.max(MOMENTUM_CONSTANTS.MIN_SCORE, state.momentumScore - totalPenalty),
          habits: updatedHabits,
          lastDecayDate: today,
        });

        debouncedSyncFn(get);
      },

      getHabitProgress: (habitId, dateKey) => {
        const state = get();
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return { current: 0, target: 1, percent: 0 };
        const logIndex = buildLogIndex(state.habitLogs);
        const log = logIndex.get(`${habitId}:${dateKey}`);
        const current = log ? log.value : 0;
        const percent = Math.min(100, (current / habit.target) * 100);
        
        return { current, target: habit.target, percent };
      },

      getTodaysMood: () => {
        const state = get();
        const today = getDateString();
        const todayLog = state.moodLogs.find((log) =>
          !log.deletedAt && log.loggedAt.startsWith(today)
        );
        return todayLog?.score ?? null;
      },

      getMoodOnDate: (dateKey) => {
        const state = get();
        const moodLog = state.moodLogs.find((log) =>
          !log.deletedAt && log.loggedAt.startsWith(dateKey)
        );
        return moodLog?.score ?? null;
      },

      isHabitCompletedToday: (habitId) => {
        const state = get();
        const today = getDateString();
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return false;
        const log = state.habitLogs.find(
          (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(today)
        );
        const skipLog = state.skipLogs.find(
          (log) => !log.deletedAt && log.habitId === habitId && log.dateKey === today
        );
        const status = getCompletionStatus(log, skipLog, habit, today);
        return status === 'complete' || status === 'skipped';
      },

      isHabitCompletedOnDate: (habitId, dateKey) => {
        const state = get();
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return false;
        const logIndex = buildLogIndex(state.habitLogs);
        const skipIndex = buildSkipIndex(state.skipLogs);
        const log = logIndex.get(`${habitId}:${dateKey}`);
        const skipLog = skipIndex.get(`${habitId}:${dateKey}`);
        const status = getCompletionStatus(log, skipLog, habit, dateKey);
        return status === 'complete' || status === 'skipped';
      },

      getHabitLogsForDate: (habitId, dateKey) => {
        const state = get();
        return state.habitLogs.filter(
          (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(dateKey)
        );
      },

      getWeeklyHabitData: (habitId) => {
        const state = get();
        const data: { date: string; completed: boolean }[] = [];
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const log = state.habitLogs.find(
            (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(dateString)
          );
          const skipLog = state.skipLogs.find(
            (log) => !log.deletedAt && log.habitId === habitId && log.dateKey === dateString
          );
          const status = getCompletionStatus(log, skipLog, habit, dateString);
          data.push({ date: dateString, completed: status === 'complete' || status === 'skipped' });
        }
        return data;
      },

      getYearlyHabitData: (habitId) => {
        const state = get();
        const data: { date: string; count: number }[] = [];
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return [];

        for (let i = 364; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const log = state.habitLogs.find(
            (log) => !log.deletedAt && log.habitId === habitId && log.completedAt.startsWith(dateString)
          );
          const skipLog = state.skipLogs.find(
            (log) => !log.deletedAt && log.habitId === habitId && log.dateKey === dateString
          );
          const status = getCompletionStatus(log, skipLog, habit, dateString);
          
          const count = (status === 'complete' || status === 'skipped') ? 1 : (status === 'partial' ? 0.5 : 0);
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
            !log.deletedAt && log.loggedAt.startsWith(dateString)
          );
          
          const scheduledHabits = state.habits.filter((h) =>
            !h.deletedAt && h.schedule.includes(dayOfWeek)
          );
          
          if (scheduledHabits.length > 0) {
            let totalWeightedCompletion = 0;
            
            scheduledHabits.forEach(h => {
                const log = state.habitLogs.find(
                    (l) => !l.deletedAt && l.habitId === h.id && l.completedAt.startsWith(dateString)
                );
                const skipLog = state.skipLogs.find(
                    (l) => !l.deletedAt && l.habitId === h.id && l.dateKey === dateString
                );
                const status = getCompletionStatus(log, skipLog, h, dateString);
                
                if (status === 'complete' || status === 'skipped') {
                    totalWeightedCompletion += 1;
                } else if (status === 'partial' && log) {
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

      getWeeklyContractStatus: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let totalScheduled = 0;
        let completed = 0;

        const activeHabits = state.habits.filter((habit) => !habit.deletedAt && !habit.isArchived);

        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dateString = getDateString(date);
          const dayOfWeek = getDayOfWeek(date);

          activeHabits.forEach((habit) => {
            const habitCreatedAt = new Date(habit.createdAt);
            habitCreatedAt.setHours(0, 0, 0, 0);
            if (habitCreatedAt > date) return;
            if (!habit.schedule.includes(dayOfWeek)) return;

            totalScheduled += 1;

            const log = state.habitLogs.find(
              (entry) => !entry.deletedAt && entry.habitId === habit.id && entry.completedAt.startsWith(dateString)
            );
            const skipLog = state.skipLogs.find(
              (entry) => !entry.deletedAt && entry.habitId === habit.id && entry.dateKey === dateString
            );
            const status = getCompletionStatus(log, skipLog, habit, dateString);

            if (status === 'complete' || status === 'skipped') {
              completed += 1;
            }
          });
        }

        const target = state.weeklyContractTarget;
        const remaining = target === null ? 0 : Math.max(0, target - completed);

        return {
          target,
          completed,
          totalScheduled,
          remaining,
          isMet: target !== null && completed >= target,
        };
      },

      getTotalVolume: () => {
        const state = get();
        return state.habits.filter(h => !h.deletedAt).map((habit) => {
          const total = state.habitLogs
            .filter((log) => !log.deletedAt && log.habitId === habit.id)
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
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        return habit?.bestStreak || 0;
      },

      getDayOfWeekEfficiency: () => {
        const state = get();
        const daysOrder: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const todayDayIndex = today.getDay();

        return daysOrder.map((day) => {
          let totalScheduled = 0;
          let totalCompletionValue = 0;
          const targetDayIndex = daysOrder.indexOf(day);

          for (let week = 0; week < 12; week++) {
            const daysBack = ((todayDayIndex - targetDayIndex + 7) % 7) + week * 7;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - daysBack);

            if (targetDate > today) continue;

            const dateString = getDateString(targetDate);
            
            const logIndex = buildLogIndex(state.habitLogs);
            const skipIndex = buildSkipIndex(state.skipLogs);
            state.habits.filter(h => !h.deletedAt).forEach((habit) => {
              if (habit.schedule.includes(day)) {
                totalScheduled++;
                const log = logIndex.get(`${habit.id}:${dateString}`);
                const skipLog = skipIndex.get(`${habit.id}:${dateString}`);
                const status = getCompletionStatus(log, skipLog, habit, dateString);
                
                if (status === 'complete' || status === 'skipped') {
                    totalCompletionValue += 1;
                } else if (status === 'partial' && log) {
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
        
        for (let i = 0; i < 24; i++) {
          hourCounts[i] = 0;
        }
        
        state.habitLogs.filter(l => !l.deletedAt).forEach((log) => {
          const hour = new Date(log.completedAt).getHours();
          const currentCount = hourCounts[hour] || 0;
          hourCounts[hour] = currentCount + 1;
        });
        
        return Object.entries(hourCounts).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }));
      },

      getHabitHealth: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => !h.deletedAt && h.id === habitId);
        if (!habit) return 0;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        const habitCreatedAt = new Date(habit.createdAt);
        habitCreatedAt.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          if (date < habitCreatedAt) continue; 
          
          const dayOfWeek = getDayOfWeek(date);
          if (!habit.schedule.includes(dayOfWeek)) continue;
          
          const weight = 7 - i; 
          totalWeight += weight;
          
          const log = state.habitLogs.find(
            (log) => !log.deletedAt && log.habitId === habit.id && log.completedAt.startsWith(getDateString(date))
          );
          const skipLog = state.skipLogs.find(
            (log) => !log.deletedAt && log.habitId === habit.id && log.dateKey === getDateString(date)
          );
          const status = getCompletionStatus(log, skipLog, habit, getDateString(date));
          
          if (status === 'complete' || status === 'skipped') {
            weightedSum += weight;
          } else if (status === 'partial' && log) {
            weightedSum += (weight * (log.value / habit.target));
          }
        }
        
        return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 100;
      },

      getWeeklySummary: () => {
        const state = get();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const activeHabits = state.habits.filter((habit) => !habit.deletedAt && !habit.isArchived);
        
        const weekLogs = state.habitLogs.filter(
          (log) => !log.deletedAt && new Date(log.completedAt) >= weekAgo
        );
        
        const habitCounts: { [key: string]: number } = {};
        weekLogs.forEach((log) => {
          habitCounts[log.habitId] = (habitCounts[log.habitId] || 0) + 1;
        });
        
        let topHabit: { name: string; completions: number } | null = null;
        let maxCompletions = 0;
        
        Object.entries(habitCounts).forEach(([habitId, count]) => {
          if (count > maxCompletions) {
            const habit = activeHabits.find((h) => h.id === habitId);
            if (habit) {
              topHabit = { name: habit.name, completions: count };
              maxCompletions = count;
            }
          }
        });
        
        let totalScheduled = 0;
        let totalCompletedValue = 0;
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = getDateString(date);
          const dayOfWeek = getDayOfWeek(date);
          
          activeHabits.forEach((habit) => {
            if (habit.schedule.includes(dayOfWeek)) {
              totalScheduled++;
              const log = state.habitLogs.find(
                (log) => !log.deletedAt && log.habitId === habit.id && log.completedAt.startsWith(dateString)
              );
              const skipLog = state.skipLogs.find(
                (log) => !log.deletedAt && log.habitId === habit.id && log.dateKey === dateString
              );
              const status = getCompletionStatus(log, skipLog, habit, dateString);
              
              if (status === 'complete' || status === 'skipped') {
                  totalCompletedValue += 1;
              } else if (status === 'partial' && log) {
                  totalCompletedValue += Math.min(1, log.value / habit.target);
              }
            }
          });
        }
        
        const weekMoods = state.moodLogs.filter(
          (log) => !log.deletedAt && new Date(log.loggedAt) >= weekAgo
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
          contract: get().getWeeklyContractStatus(),
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
            if (h.deletedAt) return false;
            const habitCreatedDate = new Date(h.createdAt);
            habitCreatedDate.setHours(0, 0, 0, 0);
            return h.schedule.includes(dayOfWeek) && habitCreatedDate <= date;
          });
          
          if (scheduledHabits.length === 0) {
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
                 (l) => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(dateString)
             );
             const skipLog = state.skipLogs.find(
                 (l) => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateString
             );
             const status = getCompletionStatus(log, skipLog, habit, dateString);
             
             if (status === 'complete' || status === 'skipped') {
                 totalCompletion += 1;
             } else if (status === 'partial' && log) {
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
        const activeMoodLogs = state.moodLogs.filter(l => !l.deletedAt);
        const activeHabits = state.habits.filter(h => !h.deletedAt);
        if (activeMoodLogs.length < 7 || activeHabits.length === 0) return null;
        
        let bestInsight: { habit: string; moodDelta: number; message: string } | null = null;
        let maxDelta = 0;
        
        activeHabits.forEach((habit) => {
          const completionDates = new Set(
            state.habitLogs
              .filter((log) => !log.deletedAt && log.habitId === habit.id && (log.value / habit.target) >= 0.5)
              .map((log) => getLocalDateKey(new Date(log.completedAt)))
          );
          
          let completionMoodSum = 0;
          let completionMoodCount = 0;
          let nonCompletionMoodSum = 0;
          let nonCompletionMoodCount = 0;
          
          activeMoodLogs.forEach((moodLog) => {
            const moodDate = getLocalDateKey(new Date(moodLog.loggedAt));
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
        const activeHabits = state.habits.filter(h => !h.deletedAt);
        const activeLogs = state.habitLogs.filter(l => !l.deletedAt);
        const streaks = activeHabits.map((h) => h.streak);
        const bestStreaks = activeHabits.map((h) => h.bestStreak || 0);
        
        return {
          totalHabits: activeHabits.length,
          totalCompletions: activeLogs.length,
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
          skipLogs: state.skipLogs,
          weeklyContractTarget: state.weeklyContractTarget,
        };
      },

      clearAllData: async () => {
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteAllUserData(user.uid);
          } catch (error) {
            console.error('Failed to clear Firestore data:', error);
          }
        }
        set({
          habits: [],
          habitLogs: [],
          moodLogs: [],
          skipLogs: [],
          weeklyContractTarget: null,
          momentumScore: MOMENTUM_CONSTANTS.INITIAL_SCORE,
          lastDecayDate: null,
          previousWeekMomentum: MOMENTUM_CONSTANTS.INITIAL_SCORE,
        });
      },

      getJoinDate: () => {
        const state = get();
        const activeHabits = state.habits.filter(h => !h.deletedAt);
        if (activeHabits.length === 0) return 'Recently joined';
        const oldestHabit = activeHabits.reduce((oldest, habit) => 
          new Date(habit.createdAt) < new Date(oldest.createdAt) ? habit : oldest
        );
        if (!oldestHabit) return 'Recently joined';
        return new Date(oldestHabit.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      },

      loadDemoData: async () => {
        const { DEMO_HABIT_CONFIGS, generateHistoricalData, calculateStreaksForHabits } = await import('@/lib/demoData');
        const state = get();
        if (state.habits.length > 0) return;
        for (const habit of DEMO_HABIT_CONFIGS) {
          await get().addHabit(habit);
        }
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        const startDateISO = getLocalDateKey(startDate);
        set((s) => ({
          habits: s.habits.map((h) => ({ ...h, createdAt: startDateISO })),
        }));
        const createdHabits = get().habits;
        const { logs, moods } = generateHistoricalData(createdHabits);
        const finalHabits = calculateStreaksForHabits(createdHabits, logs);
        set({
          habits: finalHabits,
          habitLogs: [...get().habitLogs, ...logs],
          moodLogs: [...get().moodLogs, ...moods],
          momentumScore: 85,
        });
      },

      updateWeeklyMomentum: () => {
        const state = get();
        const today = new Date();
        const lastUpdateKey = 'lastWeeklyMomentumUpdate';
        const lastUpdate = typeof window !== 'undefined' ? localStorage.getItem(lastUpdateKey) : null;
        const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
        const daysSinceUpdate = lastUpdateDate 
          ? Math.floor((today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Update if it's been 7+ days or if it's Sunday and we haven't updated this week
        const isSunday = today.getDay() === 0;
        const shouldUpdate = daysSinceUpdate >= 7 || (isSunday && (!lastUpdateDate || lastUpdateDate.getDay() !== 0));
        
        if (shouldUpdate && typeof window !== 'undefined') {
          set({ previousWeekMomentum: state.momentumScore });
          localStorage.setItem(lastUpdateKey, getLocalDateKey());
        }
      },
    }),
    {
      name: 'kinetic-storage',
      partialize: (state) => ({
        habits: state.habits,
        habitLogs: state.habitLogs,
        moodLogs: state.moodLogs,
        skipLogs: state.skipLogs,
        momentumScore: state.momentumScore,
        lastDecayDate: state.lastDecayDate,
        weeklyContractTarget: state.weeklyContractTarget,
        previousWeekMomentum: state.previousWeekMomentum,
        userName: state.userName,
        userIcon: state.userIcon,
        theme: state.theme,
      }),
      // Migration to add new fields to existing habits
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.userName = state.userName ?? 'Your Name';
          state.userIcon = state.userIcon ?? 'star';
          state.weeklyContractTarget = state.weeklyContractTarget ?? null;
          state.skipLogs = state.skipLogs ?? [];
          state.selectedDate = state.selectedDate ?? getLocalDateKey();
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
