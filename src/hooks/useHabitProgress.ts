import { useMemo } from 'react';
import { useKineticStore } from '@/store/useKineticStore';
import { getLocalDateKey } from '@/lib/dateUtils';

export function useHabitProgress(habitId: string, date?: string) {
  const { getHabitProgress } = useKineticStore();
  
  return useMemo(() => {
    const targetDate = date || getLocalDateKey();
    return getHabitProgress(habitId, targetDate);
  }, [habitId, date, getHabitProgress]);
}
