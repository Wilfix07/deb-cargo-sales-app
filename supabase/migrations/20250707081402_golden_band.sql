/*
  # Fix RLS policies for users table

  1. Security Updates
    - Drop existing problematic RLS policies
    - Create new policies with correct auth.uid() function
    - Ensure authenticated users can read their own profile
    - Allow public registration (insert)
    - Allow users to update their own profile

  2. Policy Details
    - SELECT: Users can read their own data using auth.uid()
    - INSERT: Public can insert (for registration)
    - UPDATE: Users can update their own data
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

-- Create new policies with correct auth.uid() function
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;