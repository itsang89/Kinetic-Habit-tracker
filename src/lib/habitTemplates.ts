import { DayOfWeek, HabitCategory, HabitIcon, HabitType } from '@/store/useKineticStore';

export interface HabitTemplateItem {
  name: string;
  type: HabitType;
  unit: string;
  target: number;
  schedule: DayOfWeek[];
  category: HabitCategory;
  icon: HabitIcon;
}

export interface HabitTemplatePack {
  id: 'sleep' | 'fitness' | 'study';
  label: string;
  description: string;
  habits: HabitTemplateItem[];
}

export const HABIT_TEMPLATE_PACKS: HabitTemplatePack[] = [
  {
    id: 'sleep',
    label: 'Sleep Reset',
    description: 'Simple routines for consistent sleep quality.',
    habits: [
      {
        name: 'Wind Down',
        type: 'duration',
        unit: 'mins',
        target: 30,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        category: 'health',
        icon: 'moon',
      },
      {
        name: 'No Screens Before Bed',
        type: 'simple',
        unit: 'time',
        target: 1,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        category: 'health',
        icon: 'shield',
      },
      {
        name: 'Morning Sunlight',
        type: 'duration',
        unit: 'mins',
        target: 10,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        category: 'health',
        icon: 'sun',
      },
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness Builder',
    description: 'Balanced movement plan for weekly consistency.',
    habits: [
      {
        name: 'Daily Steps',
        type: 'count',
        unit: 'steps',
        target: 8000,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        category: 'fitness',
        icon: 'target',
      },
      {
        name: 'Strength Session',
        type: 'duration',
        unit: 'mins',
        target: 40,
        schedule: ['Mon', 'Wed', 'Fri'],
        category: 'fitness',
        icon: 'dumbbell',
      },
      {
        name: 'Mobility',
        type: 'duration',
        unit: 'mins',
        target: 15,
        schedule: ['Tue', 'Thu', 'Sat'],
        category: 'fitness',
        icon: 'leaf',
      },
    ],
  },
  {
    id: 'study',
    label: 'Study Sprint',
    description: 'Focused learning cadence with review blocks.',
    habits: [
      {
        name: 'Deep Study',
        type: 'duration',
        unit: 'mins',
        target: 60,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        category: 'learning',
        icon: 'book',
      },
      {
        name: 'Practice Problems',
        type: 'count',
        unit: 'problems',
        target: 10,
        schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        category: 'learning',
        icon: 'brain',
      },
      {
        name: 'Quick Review',
        type: 'duration',
        unit: 'mins',
        target: 20,
        schedule: ['Sun'],
        category: 'learning',
        icon: 'pencil',
      },
    ],
  },
];
