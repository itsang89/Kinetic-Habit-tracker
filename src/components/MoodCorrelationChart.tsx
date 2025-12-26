'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useState, useEffect } from 'react';

export default function MoodCorrelationChart() {
  const { getMoodCorrelationData, moodLogs, habits } = useKineticStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = mounted ? getMoodCorrelationData() : [];

  if (!mounted || moodLogs.length < 3 || habits.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-neutral-400 text-xs mb-2 font-medium uppercase tracking-wider">{formatDate(label || '')}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
               <p className="text-sm font-medium text-white">
                  {item.name}: {Math.round(item.value)}%
               </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass p-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
           <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Correlation Analysis</h2>
      </div>

      <div className="h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fontSize: 10, fill: '#737373', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              tick={{ fontSize: 10, fill: '#737373', fontWeight: 500 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
               iconType="circle"
               wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Line
              type="basis"
              dataKey="mood"
              name="Mood Level"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ fill: '#000000', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: 'none' }}
              animationDuration={1500}
            />
            <Line
              type="basis"
              dataKey="completionRate"
              name="Habit Completion"
              stroke="#525252"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 6, fill: '#525252', stroke: 'none' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
