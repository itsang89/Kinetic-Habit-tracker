import { MOMENTUM_CONSTANTS } from './constants';

export type MomentumStatus = {
  label: string;
  emoji: string;
  color: string;
};

/**
 * Momentum calculation rules for V2:
 * - Proportional boost: completionRate * 10 with diminishing returns near ceiling
 * - Proportional miss penalty: -(totalMissed/totalScheduled)*10
 * - Daily base decay: -2 (already in constants)
 */

export function gainMultiplier(currentScore: number): number {
  if (currentScore < 50) return 1.5;
  if (currentScore < 80) return 1.0;
  if (currentScore < 95) return 0.5;
  return 0.25;
}

export const calculateMomentumChange = (
  completionRate: number, // 0 to 1
  isMissed: boolean,
  totalScheduled = 1,
  totalMissed = 1,
  currentScore = 50
): number => {
  if (isMissed && totalScheduled > 0) {
    return -Math.round((Math.max(totalMissed, 1) / totalScheduled) * 10);
  }
  
  const baseBoost = Math.min(10, completionRate * 10);
  const multiplier = gainMultiplier(currentScore);
  return Math.round(baseBoost * multiplier);
};

export const getMomentumStatus = (score: number): MomentumStatus => {
  if (score >= 90) return { label: 'On Fire', emoji: '🔥', color: 'var(--brand-main)' };
  if (score >= 75) return { label: 'Peak Flow', emoji: '⚡', color: 'var(--brand-main)' };
  if (score >= 60) return { label: 'In the Zone', emoji: '🎯', color: 'var(--brand-main)' };
  if (score >= 45) return { label: 'Building', emoji: '📈', color: 'var(--theme-text-primary)' };
  if (score >= 30) return { label: 'Maintaining', emoji: '⚖️', color: 'var(--theme-text-secondary)' };
  if (score >= 15) return { label: 'Starting Up', emoji: '🌱', color: 'var(--theme-text-muted)' };
  return { label: 'Getting Ready', emoji: '💤', color: 'var(--theme-text-muted)' };
};

export const getMomentumLabel = (score: number): string => {
  const status = getMomentumStatus(score);
  return `${status.label} ${status.emoji}`;
};
