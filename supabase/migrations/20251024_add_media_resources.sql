-- Create media_resources table for storing progress photos and other media
CREATE TABLE IF NOT EXISTS media_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('progress_photo', 'workout_video', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_resources_user_id ON media_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_media_resources_resource_type ON media_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_media_resources_taken_at ON media_resources(taken_at DESC);

-- Enable RLS
ALTER TABLE media_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own media
CREATE POLICY "Users can view their own media" ON media_resources
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upload their own media
CREATE POLICY "Users can upload their own media" ON media_resources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update their own media" ON media_resources
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media" ON media_resources
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all media
CREATE POLICY "Admins can view all media" ON media_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

