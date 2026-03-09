'use client';

import { motion } from 'framer-motion';
import { Plus, Zap, FileJson } from 'lucide-react';
import { HABIT_TEMPLATE_PACKS } from '@/lib/habitTemplates';
import { useKineticStore } from '@/store/useKineticStore';

interface OnboardingCardProps {
  onCreateHabit: () => void;
}

export default function OnboardingCard({ onCreateHabit }: OnboardingCardProps) {
  const loadDemoData = useKineticStore((s) => s.loadDemoData);
  const addHabit = useKineticStore((s) => s.addHabit);

  const handleTemplateSelect = async (packId: string) => {
    const pack = HABIT_TEMPLATE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    for (const h of pack.habits) {
      await addHabit({
        name: h.name,
        unit: h.unit,
        target: h.target,
        schedule: h.schedule,
        category: h.category,
        icon: h.icon,
        type: h.type,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass depth-hover p-8 rounded-2xl text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--brand-main)]/15 flex items-center justify-center mx-auto mb-6">
        <Zap className="w-10 h-10 text-[var(--brand-main)]" fill="currentColor" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">Welcome to Kinetic</h2>
      <p className="text-[var(--theme-text-secondary)] mb-6 max-w-sm mx-auto">
        Build momentum with habits. Track completions, streaks, and see how consistency affects your mood.
      </p>

      <div className="space-y-3 mb-8">
        {HABIT_TEMPLATE_PACKS.map((pack) => (
          <motion.button
            key={pack.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTemplateSelect(pack.id)}
            className="w-full p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-foreground)]/5 hover:bg-[var(--theme-foreground)]/10 text-left transition-colors"
          >
            <p className="font-semibold text-[var(--theme-text-primary)]">{pack.label}</p>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{pack.description}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateHabit}
          className="w-full py-4 rounded-xl bg-[var(--brand-main)] text-[var(--bg-base)] font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Custom Habit
        </motion.button>
        {loadDemoData && (
          <button
            onClick={loadDemoData}
            className="flex items-center justify-center gap-2 text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <FileJson className="w-4 h-4" />
            Load Sample Data
          </button>
        )}
      </div>
    </motion.div>
  );
}
