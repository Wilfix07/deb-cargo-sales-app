/*
  # Fix Authentication System Without Password Hash

  1. Database Changes
    - Remove password_hash column completely
    - Update RLS policies to work with Supabase Auth
    - Create proper trigger for user profile creation
    
  2. Security
    - Enable RLS on both tables
    - Create policies for authenticated users
    - Allow profile creation after auth signup
    
  3. User Management
    - Automatic profile creation via trigger
    - Proper role-based access control
*/

-- Remove password_hash column if it still exists
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Drop sales_records policies
DROP POLICY IF EXISTS "Users can create sales records" ON sales_records;
DROP POLICY IF EXISTS "Tellers can read own sales" ON sales_records;
DROP POLICY IF EXISTS "Managers and Admins can delete sales" ON sales_records;
DROP POLICY IF EXISTS "Users can update own sales" ON sales_records;

-- Create new user policies that work with Supabase Auth
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

-- Create new sales_records policies
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

-- Remove any old sample users that had password_hash
DELETE FROM users WHERE username IN ('admin', 'manager', 'chefteller', 'teller1');

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a profile in the users table when a new user signs up
  INSERT INTO public.users (id, username, email, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'Teller'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();