import { Habit, HabitLog, DayOfWeek } from '@/store/useKineticStore';

export function calculateHabitStats(habit: Habit, habitLogs: HabitLog[]) {
  const logs = habitLogs.filter(l => l.habitId === habit.id);
  const totalLogs = logs.length;
  
  // Success rate (last 30 days)
  const last30Days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const habitCreatedAt = new Date(habit.createdAt);
  habitCreatedAt.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateString = date.toISOString().split('T')[0] || '';
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
    
    const isScheduled = habit.schedule.includes(dayOfWeek) && date >= habitCreatedAt && date <= today;
    
    if (isScheduled) {
      const completed = logs.some(l => l.completedAt.startsWith(dateString));
      last30Days.push({ date: dateString, scheduled: true, completed });
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

export function generateCalendarData(habit: Habit, habitLogs: HabitLog[], calendarMonth: Date) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const habitCreatedAt = new Date(habit.createdAt);
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
    const dateString = date.toISOString().split('T')[0] || '';
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
    
    const isFuture = date > today;
    const isBeforeCreation = date < habitCreatedAt;
    
    const isScheduled = habit.schedule.includes(dayOfWeek);
    const log = habitLogs.find(l => l.habitId === habit.id && l.completedAt.startsWith(dateString));
    
    days.push({
      date: dateString,
      day,
      isCurrentMonth: true,
      isScheduled,
      isCompleted: !!log,
      isPartial: log ? log.value < habit.target : false,
      isShielded: false,
      value: log?.value || null,
      isFuture,
      isBeforeCreation,
    });
  }
  
  return days;
}
