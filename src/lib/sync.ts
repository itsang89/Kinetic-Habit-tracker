import { supabase, Database } from './supabase';
import type { Habit, HabitLog, MoodLog, HabitIcon, Theme, DayOfWeek, HabitCategory } from '@/store/useKineticStore';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitLogRow = Database['public']['Tables']['habit_logs']['Row'];
type MoodLogRow = Database['public']['Tables']['mood_logs']['Row'];

export interface SyncState {
  habits: Habit[];
  habitLogs: HabitLog[];
  moodLogs: MoodLog[];
  userName: string;
  userIcon: HabitIcon;
  theme: Theme;
}

export interface SyncResult {
  success: boolean;
  error?: Error;
  data?: {
    habits: Habit[];
    habitLogs: HabitLog[];
    moodLogs: MoodLog[];
    profile: {
      userName: string;
      userIcon: HabitIcon;
      theme: Theme;
    } | null;
  };
}

export async function syncToCloud(userId: string, state: SyncState): Promise<SyncResult> {
  try {
    // Skip if supabase is not available
    if (!supabase) {
      return { success: false, error: new Error('Supabase not configured') };
    }

    // 1. Sync habits
    if (state.habits.length > 0) {
      const { error: habitsError } = await supabase
        .from('habits')
        .upsert(
          state.habits.map((h: Habit) => ({
            id: h.id,
            user_id: userId,
            name: h.name,
            type: h.type,
            target: h.target,
            unit: h.unit,
            schedule: h.schedule,
            streak: h.streak,
            best_streak: h.bestStreak || 0,
            category: h.category,
            icon: h.icon,
            is_archived: h.isArchived,
            created_at: h.createdAt
          })),
          { onConflict: 'id' }
        );
      if (habitsError) throw habitsError;
    }

    // 2. Sync habit logs
    if (state.habitLogs.length > 0) {
      const { error: logsError } = await supabase
        .from('habit_logs')
        .upsert(
          state.habitLogs.map((l: HabitLog) => ({
            id: l.id,
            user_id: userId,
            habit_id: l.habitId,
            value: l.value,
            completed_at: l.completedAt
          })),
          { onConflict: 'id' }
        );
      if (logsError) throw logsError;
    }

    // 3. Sync mood logs
    if (state.moodLogs.length > 0) {
      const { error: moodsError } = await supabase
        .from('mood_logs')
        .upsert(
          state.moodLogs.map((m: MoodLog) => ({
            id: m.id,
            user_id: userId,
            score: m.score,
            logged_at: m.loggedAt
          })),
          { onConflict: 'id' }
        );
      if (moodsError) throw moodsError;
    }

    // 4. Sync profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        user_name: state.userName,
        user_icon: state.userIcon,
        theme: state.theme
      }, { onConflict: 'id' });
    if (profileError) throw profileError;

    return { success: true };
  } catch (error) {
    console.error('Sync error details:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function fetchFromCloud(userId: string): Promise<SyncResult> {
  try {
    // Skip if supabase is not available
    if (!supabase) {
      return { success: false, error: new Error('Supabase not configured') };
    }

    const [
      { data: habits, error: hErr },
      { data: logs, error: lErr },
      { data: moods, error: mErr },
      { data: profile, error: pErr }
    ] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
      supabase.from('mood_logs').select('*').eq('user_id', userId),
      supabase.from('user_profiles').select('*').eq('id', userId).single()
    ]);

    if (hErr || lErr || mErr || pErr) {
      const error = hErr || lErr || mErr || pErr;
      throw error;
    }

    return {
      success: true,
      data: {
        habits: (habits as HabitRow[] || []).map((h) => ({
          ...h,
          bestStreak: h.best_streak,
          isArchived: h.is_archived,
          createdAt: h.created_at,
          shieldAvailable: true,
          schedule: h.schedule as DayOfWeek[],
          category: h.category as HabitCategory,
          icon: h.icon as HabitIcon
        })),
        habitLogs: (logs as HabitLogRow[] || []).map((l) => ({
          ...l,
          habitId: l.habit_id,
          completedAt: l.completed_at
        })),
        moodLogs: (moods as MoodLogRow[] || []).map((m) => ({
          ...m,
          loggedAt: m.logged_at
        })),
        profile: profile ? {
          userName: profile.user_name,
          userIcon: profile.user_icon as HabitIcon,
          theme: profile.theme as Theme
        } : null
      }
    };
  } catch (error) {
    console.error('Fetch error details:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
