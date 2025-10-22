-- Add column to track individual exercise completion
ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS completed_exercises jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN daily_logs.completed_exercises IS 'Array of completed exercise names or indices, e.g. ["Bench Press", "Squats"]';

