import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageBucket = import.meta.env.VITE_STORAGE_BUCKET || "wellplan-bucket";
const maxFileSizeMB =
  Number(import.meta.env.VITE_MAX_PHYSICAL_PROGRESS_CAPTURE_SIZE) || 4;
const playstoreLink = import.meta.env.VITE_PLAYSTORE_LINK || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const STORAGE_BUCKET = storageBucket;
export const MAX_FILE_SIZE_MB = maxFileSizeMB;
export const MAX_FILE_SIZE_BYTES = maxFileSizeMB * 1024 * 1024;
export const PLAYSTORE_LINK = playstoreLink;

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

export type MediaResource = {
  id: string;
  user_id: string;
  resource_type: "progress_photo" | "workout_video" | "other";
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  description: string | null;
  taken_at: string;
  created_at: string;
  updated_at: string;
};
