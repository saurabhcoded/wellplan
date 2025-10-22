# RLS Setup Guide - Proper Implementation

## ✅ YES - We Are Now Following RLS Best Practices!

## The Problem We Fixed

### ❌ Previous Approach (WRONG):
```typescript
// This violates RLS when email confirmation is enabled
await supabase.auth.signUp({ email, password });
await supabase.from('profiles').insert({ ... }); // ❌ Fails with RLS error
```

**Why it failed:**
- RLS policy requires authenticated user: `auth.uid() = id`
- With email confirmation enabled, user isn't authenticated until they confirm
- Manual insert fails with: "new row violates row-level security policy"

### ✅ New Approach (CORRECT):
```typescript
// Pass data as metadata, let database trigger handle profile creation
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name, age, height_cm, body_fat_percentage, gender }
  }
});
// Profile automatically created by trigger - no RLS issues! ✅
```

## How It Works

### 1. **Database Trigger** (`20251022_create_profile_trigger.sql`)
```sql
CREATE FUNCTION handle_new_user() SECURITY DEFINER
-- This runs with elevated privileges, bypassing RLS
```

**Flow:**
1. User signs up → `auth.users` table gets new row
2. Trigger fires automatically
3. Trigger reads `raw_user_meta_data` from the new user
4. Trigger inserts profile with `SECURITY DEFINER` (bypasses RLS)
5. Profile is created successfully ✅

### 2. **Updated Auth Context**
- Passes health metrics as user metadata
- No manual profile insertion
- Cleaner, more maintainable code

### 3. **RLS Policies Remain Unchanged**
The existing policies still work:
- ✅ Users can view their own profile
- ✅ Users can update their own profile  
- ✅ Users can't access others' profiles
- ✅ Profile creation handled by trigger (bypasses RLS)

## Setup Instructions

### Step 1: Add Health Metrics Columns
Run in Supabase SQL Editor:
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS height_cm decimal(5,2),
ADD COLUMN IF NOT EXISTS body_fat_percentage decimal(4,2),
ADD COLUMN IF NOT EXISTS gender text;
```

### Step 2: Create the Trigger
Run the entire file: `supabase/migrations/20251022_create_profile_trigger.sql`

### Step 3: Test
1. Go to http://localhost:5173
2. Sign up with health metrics
3. Profile is automatically created ✅

## Benefits of This Approach

✅ **RLS Compliant**: Trigger runs with elevated privileges  
✅ **Works with Email Confirmation**: No authentication required during signup  
✅ **Secure**: RLS policies still protect user data after creation  
✅ **Clean Code**: No manual profile management in application code  
✅ **Recommended Pattern**: This is the official Supabase approach  
✅ **Maintainable**: All profile creation logic in one place (database)  

## Verification

Run `diagnose_profiles_setup.sql` to verify:
- [x] RLS is enabled on profiles table
- [x] Health metrics columns exist
- [x] Three RLS policies exist (SELECT, INSERT, UPDATE)
- [x] Trigger exists: `on_auth_user_created`
- [x] Function exists: `handle_new_user()`

## Summary

**Previous Issue:** Manual profile insertion violated RLS when email confirmation was enabled.

**Solution:** Database trigger with `SECURITY DEFINER` automatically creates profiles from user metadata, bypassing RLS in a secure, controlled way.

**Result:** 100% RLS compliant, works in all configurations, follows Supabase best practices! 🎉

