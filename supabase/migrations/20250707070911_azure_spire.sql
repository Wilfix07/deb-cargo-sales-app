/*
  # Create Demo Admin User

  1. Create a demo admin user that can be used for testing
  2. The user will sign up normally through the app
  3. This creates the profile that will be linked when they register
*/

-- Create demo admin user profile with a specific UUID
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
) ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

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