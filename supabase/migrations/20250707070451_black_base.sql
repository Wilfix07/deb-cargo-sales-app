/*
  # Create Demo Admin User

  1. Create demo admin user in public.users table
  2. This user can be used for testing and demonstration
  
  Note: Since we don't have direct access to auth.users table constraints,
  we'll create the user profile directly and they can sign up normally
  through the application using Supabase Auth.
*/

-- Create demo admin user profile
-- The user will need to sign up through the app with these credentials:
-- Email: admin@debcargo.com
-- Password: admin123

-- First, let's create a UUID that we'll use for the admin user
DO $$
DECLARE
  admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert the admin user profile
  -- This creates the profile that will be linked when they sign up
  INSERT INTO public.users (id, username, email, full_name, role, is_active, created_at)
  VALUES (
    admin_user_id,
    'admin',
    'admin@debcargo.com',
    'Demo Administrator',
    'Admin'::user_role,
    true,
    now()
  );
  
  -- Log that the user was created
  RAISE NOTICE 'Demo admin user profile created. User can now sign up with email: admin@debcargo.com and password: admin123';
  
EXCEPTION
  WHEN unique_violation THEN
    -- If user already exists, update their info
    UPDATE public.users 
    SET 
      username = 'admin',
      email = 'admin@debcargo.com',
      full_name = 'Demo Administrator',
      role = 'Admin'::user_role,
      is_active = true
    WHERE email = 'admin@debcargo.com' OR username = 'admin';
    
    RAISE NOTICE 'Demo admin user profile updated.';
END $$;

-- Create some sample sales records for demonstration
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