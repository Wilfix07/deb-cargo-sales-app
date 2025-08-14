/*
  # Fix RLS policy for users table

  1. Security Changes
    - Drop the existing "Users can read own profile" policy
    - Create a new policy with correct auth.uid() function reference
    - Ensure authenticated users can read their own profile data

  2. Policy Details
    - Policy name: "Users can read own profile"
    - Permission: SELECT
    - Role: authenticated
    - Condition: auth.uid() = id (corrected from uid() = id)
*/

-- Drop the existing policy with incorrect condition
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create the corrected policy
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);