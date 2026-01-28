import { useState, useEffect } from 'react';
import { Habit, HabitCategory, DayOfWeek, HabitType, HabitIcon } from '@/store/useKineticStore';

interface HabitFormState {
  name: string;
  unit: string;
  target: number;
  schedule: DayOfWeek[];
  category: HabitCategory;
  icon: HabitIcon;
  type: HabitType;
}

export function useHabitForm(habit: Habit | null, isOpen: boolean) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('times');
  const [target, setTarget] = useState(1);
  const [schedule, setSchedule] = useState<DayOfWeek[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [category, setCategory] = useState<HabitCategory>('other');
  const [icon, setIcon] = useState<HabitIcon>('star');
  const [type, setType] = useState<HabitType>('simple');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setUnit(habit.unit);
      setTarget(habit.target);
      setSchedule(habit.schedule);
      setCategory(habit.category);
      setIcon(habit.icon);
      setType(habit.type || 'simple');
    } else {
      setName('');
      setUnit('times');
      setTarget(1);
      setSchedule(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setCategory('other');
      setIcon('star');
      setType('simple');
    }
  }, [habit, isOpen]);

  const handleTypeChange = (newType: HabitType) => {
    setType(newType);
    if (newType === 'simple') {
      setTarget(1);
      setUnit('time');
    } else if (newType === 'duration') {
      setTarget(30);
      setUnit('minutes');
    } else if (newType === 'count') {
      setTarget(8);
      setUnit('glasses');
    }
  };

  const handleToggleDay = (day: DayOfWeek) => {
    setSchedule(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const validate = (): HabitFormState | null => {
    if (!name.trim()) {
      setValidationError('Habit name is required');
      return null;
    }
    if (schedule.length === 0) {
      setValidationError('Select at least one day');
      return null;
    }
    if (target <= 0) {
      setValidationError('Target must be greater than 0');
      return null;
    }
    setValidationError(null);
    return { name, unit, target, schedule, category, icon, type };
  };

  return {
    name, setName,
    unit, setUnit,
    target, setTarget,
    schedule, handleToggleDay,
    category, setCategory,
    icon, setIcon,
    type, handleTypeChange,
    validationError, setValidationError,
    validate
  };
}
