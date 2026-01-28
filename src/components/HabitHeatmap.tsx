'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useState, useEffect, useMemo } from 'react';

type HeatmapDay = {
  date: string;
  count: number;
  dayOfWeek: number;
  weekIndex: number;
};

import { useMounted } from '@/hooks/useMounted';

export default function HabitHeatmap() {
  const { habits, habitLogs } = useKineticStore();
  const mounted = useMounted();

  const heatmapData = useMemo(() => {
    if (!mounted) return [];
    
    const data: HeatmapDay[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0] || '';
      
      const completions = habitLogs.filter(
        (log) => log.completedAt.startsWith(dateString)
      ).length;
      
      data.push({
        date: dateString,
        count: completions,
        dayOfWeek: date.getDay(),
        weekIndex: Math.floor(i / 7),
      });
    }
    
    return data.reverse();
  }, [mounted, habitLogs]);
  
  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-neutral-900 border border-white/[0.05]';
    if (count === 1) return 'bg-neutral-700 border border-neutral-600';
    if (count === 2) return 'bg-neutral-500 border border-neutral-400';
    if (count === 3) return 'bg-neutral-300 border border-neutral-200';
    return 'bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]';
  };

  const weeks: typeof heatmapData[] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    heatmapData.forEach((day: HeatmapDay, index: number) => {
      const date = new Date(day.date);
      const month = date.getMonth();
      
      if (month !== lastMonth) {
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        labels.push({ month: monthName, weekIndex: Math.floor(index / 7) });
        lastMonth = month;
      }
    });
    
    return labels;
  };

  const monthLabels = getMonthLabels();

  if (!mounted || habits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
             <Calendar className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Consistency Map</h2>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Less</span>
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-sm bg-neutral-900 border border-white/10" />
               <div className="w-2 h-2 rounded-sm bg-neutral-500" />
               <div className="w-2 h-2 rounded-sm bg-white" />
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="min-w-[700px]">
          <div className="flex mb-2 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider"
                style={{ 
                  position: 'relative',
                  left: `${label.weekIndex * 14}px`,
                  marginRight: i < monthLabels.length - 1 
                    ? `${((monthLabels[i + 1]?.weekIndex ?? 0) - label.weekIndex) * 14 - 30}px` 
                    : 0
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-[3px] mr-2 text-[9px] font-medium text-neutral-600">
              <span className="h-3" />
              <span className="h-3 leading-3">M</span>
              <span className="h-3" />
              <span className="h-3 leading-3">W</span>
              <span className="h-3" />
              <span className="h-3 leading-3">F</span>
              <span className="h-3" />
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week: HeatmapDay[], weekIndex: number) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day: HeatmapDay, dayIndex: number) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.0005 }}
                      className={`
                        w-3 h-3 rounded-sm ${getIntensityColor(day.count)}
                        transition-all duration-200 hover:scale-125 hover:z-10 relative
                      `}
                      title={`${day.date}: ${day.count} habits`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
