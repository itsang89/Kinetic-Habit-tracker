import { useMemo } from 'react';
import { useKineticStore } from '@/store/useKineticStore';

export function useHabitProgress(habitId: string, date?: string) {
  const { getHabitProgress } = useKineticStore();
  
  return useMemo(() => {
    const targetDate = date || new Date().toISOString().split('T')[0] || '';
    return getHabitProgress(habitId, targetDate);
  }, [habitId, date, getHabitProgress]);
}
