import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  age: number | null;
  height_cm: number | null;
  body_fat_percentage: number | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutPlan = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  source_published_plan_id?: string | null;
  created_at: string;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds?: number; // Rest time between sets in seconds (default: 90)
  exercise_library_id?: string; // Link to exercise_library table
};

export type WorkoutDay = {
  id: string;
  plan_id: string;
  day_of_week: number;
  is_rest_day: boolean;
  workout_name: string;
  exercises: Exercise[];
  created_at: string;
};

export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  workout_completed: boolean;
  workout_day_id: string | null;
  notes: string;
  completed_exercises?: string[];
  created_at: string;
};

export type WeightLog = {
  id: string;
  user_id: string;
  log_date: string;
  weight: number;
  unit: "kg" | "lbs";
  created_at: string;
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  media_url: string;
  media_type: "gif" | "youtube" | "image";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PublishedPlan = {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: "beginner" | "intermediate" | "advanced" | null;
  duration_weeks: number;
  created_by: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type PublishedWorkoutDay = {
  id: string;
  published_plan_id: string;
  day_of_week: number;
  is_rest_day: boolean;
  workout_name: string;
  exercises: Exercise[];
  created_at: string;
};
