import { 
  Droplet, Book, Brain, Dumbbell, Heart, Sun, Moon, Coffee, 
  Pencil, Code, Music, Leaf, Target, Zap, Star, Shield 
} from 'lucide-react';
import { HabitIcon } from '@/store/useKineticStore';

export const HABIT_ICON_MAP: Record<HabitIcon, React.ElementType> = {
  droplet: Droplet,
  book: Book,
  brain: Brain,
  dumbbell: Dumbbell,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  pencil: Pencil,
  code: Code,
  music: Music,
  leaf: Leaf,
  target: Target,
  zap: Zap,
  star: Star,
  shield: Shield,
};

export const HABIT_ICON_OPTIONS: { icon: HabitIcon; component: React.ElementType }[] = [
  { icon: 'droplet', component: Droplet },
  { icon: 'book', component: Book },
  { icon: 'brain', component: Brain },
  { icon: 'dumbbell', component: Dumbbell },
  { icon: 'heart', component: Heart },
  { icon: 'sun', component: Sun },
  { icon: 'moon', component: Moon },
  { icon: 'coffee', component: Coffee },
  { icon: 'pencil', component: Pencil },
  { icon: 'code', component: Code },
  { icon: 'music', component: Music },
  { icon: 'leaf', component: Leaf },
  { icon: 'target', component: Target },
  { icon: 'zap', component: Zap },
  { icon: 'star', component: Star },
  { icon: 'shield', component: Shield },
];
