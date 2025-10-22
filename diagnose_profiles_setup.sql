-- ============================================
-- DIAGNOSTIC SCRIPT FOR PROFILES TABLE
-- Run this in Supabase SQL Editor to check your setup
-- ============================================

-- 1. Check if RLS is enabled on profiles table
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 2. Check all columns in profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check all RLS policies on profiles table
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    roles as "Roles",
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;

-- 4. Check constraints on profiles table
SELECT
    conname as "Constraint Name",
    contype as "Type",
    pg_get_constraintdef(oid) as "Definition"
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY conname;

-- ============================================
-- WHAT TO EXPECT:
-- ============================================
-- 1. RLS Enabled should be TRUE
-- 2. Columns should include: id, email, full_name, age, height_cm, body_fat_percentage, gender, created_at, updated_at
-- 3. Three policies should exist:
--    - "Users can view own profile" (SELECT)
--    - "Users can insert own profile" (INSERT) 
--    - "Users can update own profile" (UPDATE)
-- 4. Check constraints should include age_check, height_check, body_fat_check
-- ============================================

