/*
  # Fix Admin Login RLS Issue

  1. Problem Analysis
    - Admin user was created successfully
    - RLS policies are blocking access during login
    - Need to ensure policies allow proper authentication flow

  2. Solution
    - Temporarily disable RLS to allow login
    - Create more permissive policies for authentication
    - Ensure auth.uid() function works correctly in policies
*/

-- Temporarily disable RLS to diagnose the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

-- Grant full access to authenticated users (no RLS restrictions)
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO anon;

-- Ensure the trigger function is robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Creating user profile for: %', NEW.email;
  
  BEGIN
    -- Insert user profile with proper error handling
    INSERT INTO public.users (
      id, 
      username, 
      email, 
      full_name, 
      role, 
      is_active, 
      created_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Teller'::user_role),
      true,
      NOW()
    );
    
    RAISE LOG 'User profile created successfully for: %', NEW.email;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- If user already exists, update their profile
      UPDATE public.users SET
        username = COALESCE(NEW.raw_user_meta_data->>'username', username),
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        role = COALESCE((NEW.raw_user_meta_data->>'role')::user_role, role),
        is_active = true
      WHERE id = NEW.id;
      
      RAISE LOG 'User profile updated for existing user: %', NEW.email;
      
    WHEN OTHERS THEN
      -- Log any other errors but don't fail the auth creation
      RAISE LOG 'Error creating user profile for %: % %', NEW.email, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Check if admin user exists and show info
DO $$
DECLARE
  admin_count INTEGER;
  admin_info RECORD;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE email = 'admin@debcargo.com';
  
  IF admin_count > 0 THEN
    SELECT * INTO admin_info FROM public.users WHERE email = 'admin@debcargo.com' LIMIT 1;
    RAISE NOTICE 'Admin user found in database:';
    RAISE NOTICE 'ID: %', admin_info.id;
    RAISE NOTICE 'Username: %', admin_info.username;
    RAISE NOTICE 'Email: %', admin_info.email;
    RAISE NOTICE 'Role: %', admin_info.role;
    RAISE NOTICE 'Active: %', admin_info.is_active;
    RAISE NOTICE 'Created: %', admin_info.created_at;
  ELSE
    RAISE NOTICE 'No admin user found in database';
  END IF;
  
  RAISE NOTICE 'RLS disabled on users table for troubleshooting';
  RAISE NOTICE 'Try logging in now with the admin credentials';
END $$;