-- ============================================================================
-- FIX: Automatic Profile Creation on User Signup
-- ============================================================================
-- This migration fixes the issue where profiles are not created automatically
-- when users sign up via Supabase Auth
-- ============================================================================

-- Step 1: Fix RLS Policies on profiles table
-- ============================================================================

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow INSERT for authenticated users (needed for frontend safeguard)
-- Also allows service_role and postgres for trigger execution
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    auth.role() = 'service_role'
  );

-- Policy 2: Allow SELECT for own profile
CREATE POLICY "Enable select for users based on user_id" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Allow UPDATE for own profile
CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- Step 2: Create or Replace Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- This is CRITICAL - allows function to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile with data from auth.users
  INSERT INTO public.profiles (id, email, name, current_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    0
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RAISE NOTICE 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;


-- Step 3: Create Trigger on auth.users
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER INSERT on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- Step 4: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;


-- Step 5: Fix RLS Policies on categories table (for default category creation)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own categories
CREATE POLICY "Enable insert for authenticated users" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own categories
CREATE POLICY "Enable select for users based on user_id" ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own categories
CREATE POLICY "Enable update for users based on user_id" ON categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own categories
CREATE POLICY "Enable delete for users based on user_id" ON categories
  FOR DELETE
  USING (auth.uid() = user_id);


-- Step 6: Backfill existing users (one-time fix for current users without profiles)
-- ============================================================================

-- Create profiles for any existing auth.users that don't have profiles
INSERT INTO public.profiles (id, email, name, current_tier)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User') as name,
  0 as current_tier
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL; -- Only insert if profile doesn't exist
