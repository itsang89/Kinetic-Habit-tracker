'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';

import { useMounted } from '@/hooks/useMounted';

export default function MomentumScore() {
  const momentumScore = useKineticStore(state => state.momentumScore);
  const applyDailyDecay = useKineticStore(state => state.applyDailyDecay);
  const mounted = useMounted();
  const [displayScore, setDisplayScore] = useState(50); // Start with neutral value
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    if (mounted) {
      applyDailyDecay();
    }
  }, [applyDailyDecay, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const diff = momentumScore - displayScore;
    if (diff > 0) setTrend('up');
    else if (diff < 0) setTrend('down');
    else setTrend('neutral');

    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (Math.abs(momentumScore - prev) < 1) return momentumScore;
        return prev + (momentumScore > prev ? 1 : -1);
      });
    }, 20);
    return () => clearInterval(interval);
  }, [momentumScore, displayScore, mounted]);

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass depth-hover flex items-center gap-3 p-3 rounded-xl shrink-0 sm:min-w-[140px]"
    >
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${r * 2 + 16} ${r * 2 + 16}`}>
          <circle
            cx={r + 8}
            cy={r + 8}
            r={r}
            fill="none"
            stroke="var(--theme-border)"
            strokeWidth="6"
          />
          <motion.circle
            cx={r + 8}
            cy={r + 8}
            r={r}
            fill="none"
            stroke="var(--brand-main)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 6px color-mix(in oklab, var(--brand-main) 50%, transparent))'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xl font-bold text-[var(--theme-text-primary)]"
            key={displayScore}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(displayScore)}
          </motion.span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[9px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold">Energy</p>
        {trend === 'up' && (
          <span className="flex items-center gap-1 text-[var(--color-success)] text-xs font-medium">
            <TrendingUp className="w-3 h-3" /> Rising
          </span>
        )}
        {trend === 'down' && (
          <span className="flex items-center gap-1 text-neutral-400 text-xs font-medium">
            <TrendingDown className="w-3 h-3" /> Falling
          </span>
        )}
        {trend === 'neutral' && (
          <span className="flex items-center gap-1 text-neutral-500 text-xs font-medium">
            <Minus className="w-3 h-3" /> Steady
          </span>
        )}
      </div>
    </motion.div>
  );
}
