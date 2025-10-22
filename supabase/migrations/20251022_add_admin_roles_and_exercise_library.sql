/*
  # Admin Roles and Exercise Library

  This migration adds:
  1. Role system to profiles table (admin or fitninja)
  2. Exercise library table for admin-managed exercises
  3. RLS policies for role-based access

  ## Changes

  ### `profiles` table
  - Add `role` column (default: 'fitninja')

  ### `exercise_library` table (new)
  - `id` (uuid, primary key)
  - `name` (text) - Exercise name
  - `description` (text) - Exercise description
  - `tags` (text[]) - Exercise tags (e.g., 'chest', 'beginner', 'strength')
  - `media_url` (text) - URL to gif/youtube/image
  - `media_type` (text) - 'gif', 'youtube', or 'image'
  - `created_by` (uuid) - Admin who created it
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Admins can manage exercise library
  - All users can view exercise library
  - Only admins can be set manually in the database
*/

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'fitninja' CHECK (role IN ('admin', 'fitninja'));

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create exercise_library table
CREATE TABLE IF NOT EXISTS exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  tags text[] DEFAULT ARRAY[]::text[],
  media_url text DEFAULT '',
  media_type text DEFAULT 'image' CHECK (media_type IN ('gif', 'youtube', 'image')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on exercise_library
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_exercise_library_created_by ON exercise_library(created_by);
CREATE INDEX IF NOT EXISTS idx_exercise_library_tags ON exercise_library USING GIN(tags);

-- RLS Policies for exercise_library table

-- Everyone can view exercises
CREATE POLICY "Anyone can view exercise library"
  ON exercise_library FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert exercises
CREATE POLICY "Admins can insert exercises"
  ON exercise_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update exercises
CREATE POLICY "Admins can update exercises"
  ON exercise_library FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete exercises
CREATE POLICY "Admins can delete exercises"
  ON exercise_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercise_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER exercise_library_updated_at
  BEFORE UPDATE ON exercise_library
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_library_updated_at();

