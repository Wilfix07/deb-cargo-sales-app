/*
  # Create Inventory Management Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (enum: Admin, Manager, Chef Teller, Teller)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

    - `sales_records`
      - `id` (uuid, primary key)
      - `product_code` (text)
      - `product_name` (text)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_amount` (decimal)
      - `customer_name` (text)
      - `scan_type` (enum: qr, barcode, manual)
      - `scanned_data` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Chef Teller', 'Teller');
CREATE TYPE scan_type AS ENUM ('qr', 'barcode', 'manual');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'Teller',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  password_hash text NOT NULL
);

-- Create sales_records table
CREATE TABLE IF NOT EXISTS sales_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price > 0),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  customer_name text NOT NULL,
  scan_type scan_type DEFAULT 'manual',
  scanned_data text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Admin'
    )
  );

-- Sales records policies
CREATE POLICY "Users can create sales records"
  ON sales_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Tellers can read own sales"
  ON sales_records
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Admin', 'Manager', 'Chef Teller')
    )
  );

CREATE POLICY "Managers and Admins can delete sales"
  ON sales_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Users can update own sales"
  ON sales_records
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Admin', 'Manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_created_at ON sales_records(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_records_product_code ON sales_records(product_code);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, full_name, role, password_hash) 
VALUES (
  'admin',
  'admin@debcargo.com',
  'Administrator',
  'Admin',
  '1a1dc91c907325c69271ddf0c944bc72' -- Simple hash of 'admin123'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample users for testing
INSERT INTO users (username, email, full_name, role, password_hash) 
VALUES 
  ('manager', 'manager@debcargo.com', 'General Manager', 'Manager', '1a1dc91c907325c69271ddf0c944bc72'),
  ('chefteller', 'chef@debcargo.com', 'Chef Teller', 'Chef Teller', '1a1dc91c907325c69271ddf0c944bc72'),
  ('teller1', 'teller1@debcargo.com', 'Teller One', 'Teller', '1a1dc91c907325c69271ddf0c944bc72')
ON CONFLICT (username) DO NOTHING;