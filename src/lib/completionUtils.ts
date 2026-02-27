import { Habit, HabitLog, SkipLog, DayOfWeek } from '@/store/useKineticStore';
import { getLocalDateKey } from './dateUtils';

export type CompletionStatus = 'complete' | 'partial' | 'missed' | 'skipped' | 'not-scheduled';

/**
 * Unified completion logic for V2.
 * Rules:
 * - 'complete': value >= target
 * - 'partial': 0 < value < target
 * - 'skipped': has skip log (SkipLog)
 * - 'missed': value == 0 (or no log) AND scheduled AND not skipped AND (past or today)
 * - 'not-scheduled': not in schedule OR before creation OR future
 */
export const getCompletionStatus = (
  habitLog: HabitLog | undefined,
  skipLog: SkipLog | undefined,
  habit: Habit,
  dateKey: string
): CompletionStatus => {
  const todayKey = getLocalDateKey();
  
  // Parse date key
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;

  // Helper to parse dates
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    if (dStr.includes('T')) return new Date(dStr);
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const habitCreatedAt = parseDate(habit.createdAt);
  habitCreatedAt.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // 1. Check if scheduled and existed
  const isScheduled = habit.schedule.includes(dayOfWeek);
  const isBeforeCreation = checkDate < habitCreatedAt;
  const isFuture = dateKey > todayKey;

  if (!isScheduled || isBeforeCreation || isFuture) {
    return 'not-scheduled';
  }

  // 2. Check for skip log
  if (skipLog) {
    return 'skipped';
  }

  // 3. Check habit log
  if (habitLog && habitLog.value > 0) {
    if (habitLog.value >= habit.target) {
      return 'complete';
    }
    return 'partial';
  }

  // 4. Everything else that is scheduled and past/today is missed
  return 'missed';
};
