-- Add health metrics to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS height_cm decimal(5,2),
ADD COLUMN IF NOT EXISTS body_fat_percentage decimal(4,2),
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add constraints for reasonable values
ALTER TABLE profiles
ADD CONSTRAINT age_check CHECK (age IS NULL OR (age >= 10 AND age <= 120)),
ADD CONSTRAINT height_check CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 300)),
ADD CONSTRAINT body_fat_check CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 2 AND body_fat_percentage <= 70));

