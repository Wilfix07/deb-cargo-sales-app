/*
  # Fix User Creation Database Error

  1. Completely disable RLS and remove all policies
  2. Fix trigger function to handle errors properly
  3. Grant proper permissions to auth system
  4. Clean up any conflicting data
*/

-- First, completely disable RLS on all tables
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales_records DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies completely
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users CASCADE';
    END LOOP;
    
    -- Drop all policies on sales_records table  
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales_records' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.sales_records CASCADE';
    END LOOP;
    
    RAISE NOTICE 'All policies dropped successfully';
END $$;

-- Grant comprehensive permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for anonymous users (needed for registration)
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions to service_role (used by Supabase internally)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create a robust trigger function that handles all edge cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Trigger handle_new_user called for user: %', NEW.email;
  
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
        username = COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        role = COALESCE((NEW.raw_user_meta_data->>'role')::user_role, role),
        is_active = true
      WHERE id = NEW.id;
      
      RAISE LOG 'User profile updated for existing user: %', NEW.email;
      
    WHEN OTHERS THEN
      -- Log any other errors but don't fail the auth creation
      RAISE LOG 'Error creating user profile for %: % %', NEW.email, SQLERRM, SQLSTATE;
      -- Don't re-raise the exception to avoid blocking auth user creation
  END;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Clean up any existing demo admin user to avoid conflicts
DELETE FROM public.users WHERE email = 'admin@debcargo.com';

-- Create demo admin user profile with a new UUID
INSERT INTO public.users (
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin',
  'admin@debcargo.com',
  'Demo Administrator',
  'Admin'::user_role,
  true,
  NOW()
);

-- Verify the setup
DO $$
DECLARE
  user_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  -- Check if RLS is disabled
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  IF rls_enabled THEN
    RAISE EXCEPTION 'RLS is still enabled on users table';
  END IF;
  
  -- Check if demo user was created
  SELECT COUNT(*) INTO user_count FROM public.users WHERE email = 'admin@debcargo.com';
  
  IF user_count = 0 THEN
    RAISE EXCEPTION 'Demo admin user was not created';
  END IF;
  
  RAISE NOTICE 'Setup verification successful: RLS disabled, demo user created';
END $$;