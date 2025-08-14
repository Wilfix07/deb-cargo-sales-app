/*
  # Fix RLS and ensure proper database access

  1. Disable RLS completely on all tables
  2. Grant proper permissions to authenticated users
  3. Ensure no conflicting policies exist
  4. Create demo admin user for testing
*/

-- Disable Row Level Security completely
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_records DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
    
    -- Drop all policies on sales_records table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales_records' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.sales_records';
    END LOOP;
END $$;

-- Grant full access to authenticated users
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.sales_records TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant to anon for registration
GRANT SELECT, INSERT ON public.users TO anon;

-- Ensure the trigger function works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a profile in the users table when a new user signs up
  INSERT INTO public.users (id, username, email, full_name, role, is_active, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'Teller'::user_role),
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    created_at = EXCLUDED.created_at;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create demo admin user profile
INSERT INTO public.users (
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@debcargo.com',
  'Demo Administrator',
  'Admin'::user_role,
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Create sample sales records
INSERT INTO public.sales_records (
  product_code,
  product_name,
  quantity,
  unit_price,
  total_amount,
  customer_name,
  scan_type,
  user_id,
  created_at
) VALUES 
  ('PROD001', 'Sample Product 1', 2, 25.50, 51.00, 'John Doe', 'manual', '00000000-0000-0000-0000-000000000001', now() - interval '2 days'),
  ('PROD002', 'Sample Product 2', 1, 15.75, 15.75, 'Jane Smith', 'qr', '00000000-0000-0000-0000-000000000001', now() - interval '1 day'),
  ('PROD003', 'Sample Product 3', 3, 10.00, 30.00, 'Bob Johnson', 'barcode', '00000000-0000-0000-0000-000000000001', now())
ON CONFLICT DO NOTHING;

-- Verify RLS is disabled
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE EXCEPTION 'RLS is still enabled on users table';
  END IF;
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'sales_records' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE EXCEPTION 'RLS is still enabled on sales_records table';
  END IF;
  
  RAISE NOTICE 'RLS successfully disabled on all tables';
END $$;