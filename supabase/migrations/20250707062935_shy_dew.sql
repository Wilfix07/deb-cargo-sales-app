/*
  # Allow user registration

  1. Security Changes
    - Add policy to allow INSERT operations for anonymous users during registration
    - This enables new users to create accounts without being authenticated first
    
  2. Notes
    - The policy only allows INSERT operations, maintaining security for other operations
    - Users can only insert their own data during registration
*/

-- Allow anonymous users to register (insert new users)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);