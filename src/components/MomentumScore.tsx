'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass p-8 flex flex-col items-center justify-center relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center gap-2 mb-6 z-10">
        <div className="w-1 h-1 rounded-full bg-white" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Momentum Score</h2>
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow behind */}
        <div className="absolute inset-0 rounded-full blur-[60px] bg-white/[0.05]" />

        <svg className="w-full h-full transform -rotate-90 relative z-10">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="90"
            fill="none"
            stroke="#262626"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="128"
            cy="128"
            r="90"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
            }}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.span
            className="text-7xl font-bold text-white tracking-tighter"
            key={displayScore}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(displayScore)}
          </motion.span>
        </div>
      </div>

      {/* Trend indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 mt-6 py-2 px-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
      >
        {trend === 'up' && (
          <>
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-medium uppercase tracking-wider">Rising</span>
          </>
        )}
        {trend === 'down' && (
          <>
            <TrendingDown className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Falling</span>
          </>
        )}
        {trend === 'neutral' && (
          <>
            <Minus className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Steady</span>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
