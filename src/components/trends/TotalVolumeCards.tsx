'use client';

import { motion } from 'framer-motion';
import { Trophy, BookOpen, Dumbbell, Brain, Droplets, Expand } from 'lucide-react';
import { useKineticStore } from '@/store/useKineticStore';
import { useEffect, useState } from 'react';
import TrendDetailModal from './TrendDetailModal';

const getIconForUnit = (unit: string) => {
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('page')) return BookOpen;
  if (unitLower.includes('rep') || unitLower.includes('min') && unitLower.includes('exercise')) return Dumbbell;
  if (unitLower.includes('cup') || unitLower.includes('water')) return Droplets;
  return Brain;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function TotalVolumeCards() {
  const { getTotalVolume, habits } = useKineticStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const volumes = mounted ? getTotalVolume() : [];

  // Get top 3 by volume
  const topVolumes = [...volumes]
    .filter(v => v.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // All volumes sorted
  const allVolumes = [...volumes]
    .filter(v => v.total > 0)
    .sort((a, b) => b.total - a.total);

  if (!mounted || habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 h-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Total Volume</h3>
        </div>
        <p className="text-[var(--theme-text-secondary)] text-sm text-center py-8">
          Complete habits to see your totals
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--theme-foreground)]/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[var(--theme-text-primary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Lifetime Totals</h3>
        </div>
        {allVolumes.length > 3 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[var(--theme-foreground)]/5 text-[11px] md:text-[10px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-foreground)]/10 transition-all uppercase tracking-wider flex items-center gap-1.5"
          >
            <span className="font-semibold">All Totals</span>
            <Expand className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {topVolumes.length > 0 ? (
          topVolumes.map((item, index) => {
            const Icon = getIconForUnit(item.unit);
            return (
              <motion.div
                key={item.habitId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${index === 0 
                    ? 'bg-[var(--theme-foreground)]/10 border-[var(--theme-foreground)]/20' 
                    : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)]'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${index === 0 ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-primary)]'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--theme-text-primary)] font-semibold truncate">{item.name}</p>
                  <p className="text-[var(--theme-text-secondary)] text-xs uppercase tracking-wider">{item.unit}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${index === 0 ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-primary)]/80'}`}>
                    {formatNumber(item.total)}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[var(--theme-text-secondary)] text-sm text-center">
              Complete habits to build your totals
            </p>
          </div>
        )}
      </div>

      {/* Total summary */}
      {topVolumes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--theme-border)]">
          <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">
            {volumes.filter(v => v.total > 0).length} habits tracked
          </p>
        </div>
      )}

      {/* Full View Modal */}
      <TrendDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lifetime Volume Totals"
        subtitle="All-time cumulative totals for each habit"
      >
        <div className="space-y-4">
          {allVolumes.map((item, index) => {
            const Icon = getIconForUnit(item.unit);
            return (
              <motion.div
                key={item.habitId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${index === 0 
                    ? 'bg-[var(--theme-foreground)]/10 border-[var(--theme-foreground)]/20' 
                    : 'bg-[var(--theme-foreground)]/5 border-[var(--theme-border)]'
                  }
                `}
              >
                <div className="text-[var(--theme-text-secondary)] font-bold text-lg w-8">
                  #{index + 1}
                </div>
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${index === 0 ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'bg-[var(--theme-foreground)]/10 text-[var(--theme-text-primary)]'}
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--theme-text-primary)] font-semibold">{item.name}</p>
                  <p className="text-[var(--theme-text-secondary)] text-xs uppercase tracking-wider">{item.unit}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${index === 0 ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-primary)]/80'}`}>
                    {formatNumber(item.total)}
                  </p>
                </div>
              </motion.div>
            );
          })}
          
          {/* Grand Total */}
          <div className="mt-8 pt-6 border-t border-[var(--theme-border)]">
            <div className="text-center">
              <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Total Actions</p>
              <p className="text-4xl font-bold text-[var(--theme-text-primary)]">
                {formatNumber(allVolumes.reduce((sum, v) => sum + v.total, 0))}
              </p>
            </div>
          </div>
        </div>
      </TrendDetailModal>
    </motion.div>
  );
}
