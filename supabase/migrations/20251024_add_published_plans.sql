-- Add published_plans table for admin-created shareable plans
CREATE TABLE IF NOT EXISTS published_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add published_workout_days table
CREATE TABLE IF NOT EXISTS published_workout_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_plan_id UUID REFERENCES published_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_rest_day BOOLEAN DEFAULT false,
  workout_name TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add source_published_plan_id to workout_plans to track copied plans
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS source_published_plan_id UUID REFERENCES published_plans(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_published_plans_published ON published_plans(is_published);
CREATE INDEX IF NOT EXISTS idx_published_plans_created_by ON published_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_published_workout_days_plan ON published_workout_days(published_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_source ON workout_plans(source_published_plan_id);

-- Enable RLS
ALTER TABLE published_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_workout_days ENABLE ROW LEVEL SECURITY;

-- RLS Policies for published_plans
-- Everyone can view published plans
CREATE POLICY "Anyone can view published plans" ON published_plans
  FOR SELECT
  USING (is_published = true);

-- Admins can view all plans (published and unpublished)
CREATE POLICY "Admins can view all published plans" ON published_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create published plans
CREATE POLICY "Admins can create published plans" ON published_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update their own published plans
CREATE POLICY "Admins can update their published plans" ON published_plans
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete their own published plans
CREATE POLICY "Admins can delete their published plans" ON published_plans
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for published_workout_days
-- Everyone can view workout days of published plans
CREATE POLICY "Anyone can view published workout days" ON published_workout_days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM published_plans
      WHERE published_plans.id = published_workout_days.published_plan_id
      AND published_plans.is_published = true
    )
  );

-- Admins can view all workout days
CREATE POLICY "Admins can view all published workout days" ON published_workout_days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create workout days for their published plans
CREATE POLICY "Admins can create published workout days" ON published_workout_days
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM published_plans
      WHERE published_plans.id = published_workout_days.published_plan_id
      AND published_plans.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Admins can update workout days for their published plans
CREATE POLICY "Admins can update published workout days" ON published_workout_days
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM published_plans
      WHERE published_plans.id = published_workout_days.published_plan_id
      AND published_plans.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Admins can delete workout days for their published plans
CREATE POLICY "Admins can delete published workout days" ON published_workout_days
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM published_plans
      WHERE published_plans.id = published_workout_days.published_plan_id
      AND published_plans.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

