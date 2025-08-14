/*
  # Fix User Registration RLS Policies

  1. Security Changes
    - Update RLS policies to work with Supabase Auth properly
    - Allow user registration through auth.users first, then profile creation
    - Fix policy references to use proper auth functions

  2. Policy Updates
    - Remove password_hash column since Supabase Auth handles passwords
    - Update policies to reference auth.uid() correctly
    - Add proper policies for user profile creation
*/

-- First, remove the password_hash column since Supabase Auth handles passwords
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- Allow authenticated users to insert their own profile after auth signup
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update sales_records policies to use proper auth.uid() references
DROP POLICY IF EXISTS "Users can create sales records" ON sales_records;
DROP POLICY IF EXISTS "Tellers can read own sales" ON sales_records;
DROP POLICY IF EXISTS "Managers and Admins can delete sales" ON sales_records;
DROP POLICY IF EXISTS "Users can update own sales" ON sales_records;

CREATE POLICY "Users can create sales records"
  ON sales_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tellers can read own sales"
  ON sales_records
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Manager', 'Chef Teller')
    )
  );

CREATE POLICY "Users can update own sales"
  ON sales_records
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Managers and Admins can delete sales"
  ON sales_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Manager')
    )
  );

-- Remove the old sample users since they won't work without password_hash
DELETE FROM users WHERE username IN ('admin', 'manager', 'chefteller', 'teller1');

-- Create a function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- This function will be called by a trigger when a new user signs up
  -- It creates a profile in the users table
  INSERT INTO public.users (id, username, email, full_name, role)
  VALUES (
    new.id,
    split_part(new.email, '@', 1), -- Use email prefix as default username
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'Teller')::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();