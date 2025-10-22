-- ============================================
-- FIX: Automatic Profile Creation
-- This ensures profiles are always created for new users
-- ============================================

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  -- SECURITY DEFINER means this runs with elevated privileges, bypassing RLS
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    age,
    height_cm,
    body_fat_percentage,
    gender,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL AND NEW.raw_user_meta_data->>'age' != ''
      THEN (NEW.raw_user_meta_data->>'age')::integer 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'height_cm' IS NOT NULL AND NEW.raw_user_meta_data->>'height_cm' != ''
      THEN (NEW.raw_user_meta_data->>'height_cm')::decimal 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'body_fat_percentage' IS NOT NULL AND NEW.raw_user_meta_data->>'body_fat_percentage' != ''
      THEN (NEW.raw_user_meta_data->>'body_fat_percentage')::decimal 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'gender', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (Run these to check)
-- ============================================

-- Check if trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists:
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Manually create missing profiles for existing users:
-- INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
-- SELECT 
--   au.id,
--   au.email,
--   COALESCE(au.raw_user_meta_data->>'fullName', au.raw_user_meta_data->>'full_name', ''),
--   au.created_at,
--   NOW()
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL
-- ON CONFLICT (id) DO NOTHING;

