'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { subDays } from '@/lib/dateUtils';

export type DateRangePreset = '7' | '30' | '90' | 'custom';

export interface TrendsFilterState {
  startDate: Date;
  endDate: Date;
  days: number;
  preset: DateRangePreset;
  habitFilterId: string | null;
}

const defaultRange = {
  startDate: subDays(new Date(), 30),
  endDate: new Date(),
  days: 30,
  preset: '30' as DateRangePreset,
  habitFilterId: null as string | null,
};

const TrendsFilterContext = createContext<{
  filter: TrendsFilterState;
  setDateRange: (preset: DateRangePreset, days?: number) => void;
  setHabitFilter: (habitId: string | null) => void;
} | null>(null);

export function TrendsFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<TrendsFilterState>(defaultRange);

  const setDateRange = (preset: DateRangePreset, days?: number) => {
    const d = days ?? (preset === '7' ? 7 : preset === '90' ? 90 : 30);
    setFilter((prev) => ({
      ...prev,
      preset,
      days: d,
      startDate: subDays(new Date(), d),
      endDate: new Date(),
    }));
  };

  const setHabitFilter = (habitId: string | null) => {
    setFilter((prev) => ({ ...prev, habitFilterId: habitId }));
  };

  const value = useMemo(
    () => ({ filter, setDateRange, setHabitFilter }),
    [filter]
  );

  return (
    <TrendsFilterContext.Provider value={value}>
      {children}
    </TrendsFilterContext.Provider>
  );
}

export function useTrendsFilter() {
  const ctx = useContext(TrendsFilterContext);
  return ctx;
}
