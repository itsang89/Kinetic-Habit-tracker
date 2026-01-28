import { Habit, HabitLog, MoodLog, DayOfWeek, HabitCategory, HabitIcon, HabitType } from '@/store/useKineticStore';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const DEMO_HABIT_CONFIGS: { name: string; unit: string; target: number; schedule: DayOfWeek[]; category: HabitCategory; icon: HabitIcon; type: HabitType }[] = [
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

export function generateHistoricalData(habits: Habit[], days = 90) {
  const today = new Date();
  const logs: HabitLog[] = [];
  const moods: MoodLog[] = [];
  
  for (let daysAgo = days; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateString = date.toISOString().split('T')[0] || '';
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
    
    habits.forEach((habit, habitIndex) => {
      if (!habit.schedule.includes(dayOfWeek)) return;
      
      const baseInteractionRate = 0.5 + (habitIndex * 0.04);
      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
      const weekendPenalty = (isWeekend && (habit.category === 'productivity' || habit.category === 'learning')) ? 0.2 : 0;
      const recencyBonus = daysAgo < 21 ? 0.2 : 0;
      
      const interactionChance = Math.min(0.98, baseInteractionRate - weekendPenalty + recencyBonus);
      
      if (Math.random() < interactionChance) {
        const hour = 6 + Math.floor(Math.random() * 17);
        const minute = Math.floor(Math.random() * 60);
        const completedAt = new Date(date);
        completedAt.setHours(hour, minute, 0, 0);
        
        let value = habit.target;
        if (habit.type === 'simple') {
          value = 1;
        } else {
          const randomFactor = Math.random();
          if (randomFactor < 0.15) {
            value = Math.floor(habit.target * (0.3 + Math.random() * 0.6));
          } else if (randomFactor < 0.85) {
            value = habit.target;
          } else {
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
    
    const baseMood = 6.0;
    const dayLogs = logs.filter(l => l.completedAt.startsWith(dateString));
    const scheduledForDay = habits.filter(h => h.schedule.includes(dayOfWeek)).length;
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
  
  return { logs, moods };
}

export function calculateStreaksForHabits(habits: Habit[], logs: HabitLog[], days = 90) {
  const today = new Date();
  
  return habits.map(habit => {
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (let daysAgo = days; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateString = date.toISOString().split('T')[0] || '';
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] as DayOfWeek;
      
      if (habit.schedule.includes(dayOfWeek)) {
        const log = logs.find(l => l.habitId === habit.id && l.completedAt.startsWith(dateString));
        const isCompleted = log ? log.value >= habit.target : false;
        
        if (isCompleted) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
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
}
