import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'simple' | 'duration' | 'count';
          unit: string;
          target: number;
          schedule: string[];
          streak: number;
          best_streak: number;
          category: string;
          icon: string;
          is_archived: boolean;
          created_at: string;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          value: number;
          completed_at: string;
          created_at: string;
        };
      };
      mood_logs: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          logged_at: string;
          created_at: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_name: string;
          user_icon: string;
          theme: string;
          created_at: string;
        };
      };
    };
  };
};
