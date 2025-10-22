-- ============================================
-- Automatic Profile Creation Trigger
-- This is the recommended Supabase pattern
-- ============================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::integer 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'height_cm' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'height_cm')::decimal 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'body_fat_percentage' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'body_fat_percentage')::decimal 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'gender',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- How it works:
-- 1. User signs up via supabase.auth.signUp() with metadata
-- 2. This trigger automatically creates a profile with that metadata
-- 3. Trigger runs with SECURITY DEFINER, bypassing RLS
-- 4. Works regardless of email confirmation settings
-- 5. Users can update health metrics later via the Account page
-- ============================================

