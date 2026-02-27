import { Habit, HabitLog, DayOfWeek, SkipLog } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';
import { getCompletionStatus } from '@/lib/completionUtils';

export function calculateHabitStats(habit: Habit, habitLogs: HabitLog[], skipLogs: SkipLog[]) {
  const logs = habitLogs.filter(l => !l.deletedAt && l.habitId === habit.id);
  const totalLogs = logs.length;
  
  // Success rate (last 30 days)
  const last30Days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const parseDate = (dStr: string) => {
    if (dStr.includes('T')) return new Date(dStr);
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };

  const habitCreatedAt = parseDate(habit.createdAt);
  habitCreatedAt.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateString = getLocalDateKey(date);
    
    const log = logs.find(l => l.completedAt.startsWith(dateString));
    const skipLog = skipLogs.find(l => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateString);
    const status = getCompletionStatus(log, skipLog, habit, dateString);
    
    if (status !== 'not-scheduled') {
      const isSuccessful = status === 'complete' || status === 'skipped';
      last30Days.push({ date: dateString, scheduled: true, completed: isSuccessful });
    }
  }
  
  const scheduledDays = last30Days.filter(d => d.scheduled).length;
  const completedDays = last30Days.filter(d => d.completed).length;
  const successRate = scheduledDays > 0 ? (completedDays / scheduledDays) * 100 : 0;
  
  // Total volume
  const totalVolume = logs.reduce((sum, l) => sum + l.value, 0);
  
  return {
    totalLogs,
    successRate,
    totalVolume,
    scheduledDays,
    completedDays,
  };
}

export function generateCalendarData(habit: Habit, habitLogs: HabitLog[], skipLogs: SkipLog[], calendarMonth: Date) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (dStr: string) => {
    if (dStr.includes('T')) return new Date(dStr);
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };

  const habitCreatedAt = parseDate(habit.createdAt);
  habitCreatedAt.setHours(0, 0, 0, 0);
  
  const days = [];
  
  // Add empty days for alignment
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ 
      date: '', day: 0, isCurrentMonth: false, isScheduled: false, 
      isCompleted: false, isPartial: false, isShielded: false, 
      value: null, isFuture: false, isBeforeCreation: false 
    });
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateString = getLocalDateKey(date);
    
    const log = habitLogs.find(l => !l.deletedAt && l.habitId === habit.id && l.completedAt.startsWith(dateString));
    const skipLog = skipLogs.find(l => !l.deletedAt && l.habitId === habit.id && l.dateKey === dateString);
    const status = getCompletionStatus(log, skipLog, habit, dateString);
    
    const isFuture = date > today;
    const isBeforeCreation = date < habitCreatedAt;
    
    days.push({
      date: dateString,
      day,
      isCurrentMonth: true,
      isScheduled: status !== 'not-scheduled',
      isCompleted: status === 'complete' || status === 'skipped',
      isPartial: status === 'partial',
      isShielded: status === 'skipped',
      value: log?.value || null,
      isFuture,
      isBeforeCreation,
    });
  }
  
  return days;
}
