/*
  # Fix RLS policies for users table

  1. Security Updates
    - Enable RLS on users table if not already enabled
    - Add policy for authenticated users to read their own profile
    - Add policy for users to update their own profile
    - Add policy for public registration (insert)

  2. Notes
    - This ensures users can read and update their own profiles
    - Allows new user registration to work properly
    - Maintains security by restricting access to own data only
*/

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow public registration (insert)
CREATE POLICY "Enable insert for registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);