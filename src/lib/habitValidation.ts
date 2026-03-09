import { Habit, HabitCategory, HabitType } from '@/store/useKineticStore';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateHabit(habit: Partial<Habit>): ValidationResult {
  const errors: string[] = [];

  if (!habit.name?.trim()) {
    errors.push('Name is required');
  } else if (habit.name.length > 50) {
    errors.push('Name must be 50 characters or less');
  }

  if (habit.target !== undefined && habit.target <= 0) {
    errors.push('Target must be greater than 0');
  }

  if (habit.schedule && habit.schedule.length === 0) {
    errors.push('Select at least one day');
  }

  const validTypes: HabitType[] = ['simple', 'duration', 'count'];
  if (habit.type && !validTypes.includes(habit.type)) {
    errors.push('Invalid habit type');
  }

  const validCategories: HabitCategory[] = ['health', 'learning', 'productivity', 'mindfulness', 'fitness', 'other'];
  if (habit.category && !validCategories.includes(habit.category)) {
    errors.push('Invalid category');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
