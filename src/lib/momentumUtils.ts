import { MOMENTUM_CONSTANTS } from './constants';

export type MomentumStatus = {
  label: string;
  emoji: string;
  color: string;
};

/**
 * Momentum calculation rules for V2:
 * - Proportional boost: completionRate * 10 (capped at +10 per habit per day)
 * - Miss penalty: -5 per missed scheduled habit (status === 'missed')
 * - Daily base decay: -2 (already in constants)
 */

export const calculateMomentumChange = (
  completionRate: number, // 0 to 1
  isMissed: boolean
): number => {
  if (isMissed) {
    return -5; // Penalty for missed scheduled habit
  }
  
  // Proportional boost: +10 for 100% completion, +5 for 50%, etc.
  const boost = Math.min(10, completionRate * 10);
  return boost;
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
