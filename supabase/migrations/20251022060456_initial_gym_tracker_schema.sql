/*
  # Gym Progress Tracker - Initial Schema

  This migration creates the complete database schema for a gym progress tracking application.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `workout_plans`
  - `id` (uuid, primary key) - Unique workout plan identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `name` (text) - Plan name (e.g., "Week 1 - Strength")
  - `start_date` (date) - When the plan starts
  - `end_date` (date) - When the plan ends
  - `is_active` (boolean) - Whether this is the current active plan
  - `created_at` (timestamptz) - Creation timestamp

  ### `workout_days`
  - `id` (uuid, primary key) - Unique identifier
  - `plan_id` (uuid, foreign key) - References workout_plans
  - `day_of_week` (integer) - Day of week (0=Sunday, 6=Saturday)
  - `is_rest_day` (boolean) - Whether this is a rest day
  - `workout_name` (text) - Name of the workout (e.g., "Chest & Triceps")
  - `exercises` (jsonb) - Array of exercises with sets/reps
  - `created_at` (timestamptz) - Creation timestamp

  ### `daily_logs`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `log_date` (date) - Date of the log entry
  - `workout_completed` (boolean) - Whether workout was completed
  - `workout_day_id` (uuid, foreign key, nullable) - References workout_days
  - `notes` (text) - User notes for the day
  - `created_at` (timestamptz) - Creation timestamp

  ### `weight_logs`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles
  - `log_date` (date) - Date of weight measurement
  - `weight` (decimal) - Weight in kg or lbs
  - `unit` (text) - 'kg' or 'lbs'
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security

  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Users can only access their own profiles, plans, logs, and weight data
  - Separate policies for SELECT, INSERT, UPDATE, and DELETE operations

  ## 3. Important Notes

  - All timestamps use timestamptz for proper timezone handling
  - workout_days.exercises uses JSONB for flexible exercise storage
  - Unique constraints prevent duplicate daily logs for same date
  - Indexes on foreign keys and date columns for optimal query performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Create workout_days table
CREATE TABLE IF NOT EXISTS workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_rest_day boolean DEFAULT false,
  workout_name text DEFAULT '',
  exercises jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  workout_completed boolean DEFAULT false,
  workout_day_id uuid REFERENCES workout_days(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  weight decimal(5,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'lbs')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, log_date);

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for workout_plans table
CREATE POLICY "Users can view own workout plans"
  ON workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for workout_days table
CREATE POLICY "Users can view own workout days"
  ON workout_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout days"
  ON workout_days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout days"
  ON workout_days FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout days"
  ON workout_days FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_days.plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for daily_logs table
CREATE POLICY "Users can view own daily logs"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for weight_logs table
CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);