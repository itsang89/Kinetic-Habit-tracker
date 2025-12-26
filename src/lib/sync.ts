import { supabase } from './supabase';
import type { Habit, HabitLog, MoodLog } from '@/store/useKineticStore';

export async function syncToCloud(userId: string, state: any) {
  try {
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
  } catch (error: any) {
    console.error('Sync error details:', error);
    return { success: false, error };
  }
}

export async function fetchFromCloud(userId: string) {
  try {
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

    if (hErr || lErr || mErr) throw (hErr || lErr || mErr);

    return {
      success: true,
      data: {
        habits: habits?.map((h: any) => ({
          ...h,
          bestStreak: h.best_streak,
          isArchived: h.is_archived,
          createdAt: h.created_at
        })) || [],
        habitLogs: logs?.map((l: any) => ({
          ...l,
          habitId: l.habit_id,
          completedAt: l.completed_at
        })) || [],
        moodLogs: moods?.map((m: any) => ({
          ...m,
          loggedAt: m.logged_at
        })) || [],
        profile: profile ? {
          userName: profile.user_name,
          userIcon: profile.user_icon,
          theme: profile.theme
        } : null
      }
    };
  } catch (error: any) {
    console.error('Fetch error details:', error);
    return { success: false, error };
  }
}

