/*
  # Setup Role-Based Access Control

  1. Security Changes
    - Enable RLS on all tables
    - Create comprehensive policies based on user roles
    - Ensure proper access control for each role

  2. Role Permissions
    - Admin: Full access to everything
    - Manager: Can view all sales, manage inventory, delete records
    - Chef Teller: Can view all sales, manage inventory (read-only)
    - Teller: Can only view/manage their own sales records

  3. Tables Covered
    - users: Profile management
    - sales_records: Sales data access
    - products: Inventory management
    - categories: Category management
    - suppliers: Supplier management
    - stock_movements: Stock tracking
    - purchase_orders: Purchase management
*/

-- First, ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
    tables_to_clean text[] := ARRAY['users', 'sales_records', 'products', 'categories', 'suppliers', 'stock_movements', 'purchase_orders', 'purchase_order_items'];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_to_clean
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = table_name AND schemaname = 'public')
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(table_name) || ' CASCADE';
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM users
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_result, 'Teller'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has admin/manager privileges
CREATE OR REPLACE FUNCTION has_admin_privileges(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role IN ('Admin', 'Manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can view all sales
CREATE OR REPLACE FUNCTION can_view_all_sales(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role IN ('Admin', 'Manager', 'Chef Teller')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Allow users to read their own profile
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read all user profiles
CREATE POLICY "users_select_admin"
  ON users
  FOR SELECT
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update any user profile
CREATE POLICY "users_update_admin"
  ON users
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Allow public registration
CREATE POLICY "users_insert_registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow admins to create users
CREATE POLICY "users_insert_admin"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()));

-- Allow admins to delete users
CREATE POLICY "users_delete_admin"
  ON users
  FOR DELETE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- SALES RECORDS POLICIES
-- Tellers can only see their own sales
CREATE POLICY "sales_select_own"
  ON sales_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin, Manager, Chef Teller can see all sales
CREATE POLICY "sales_select_all_privileged"
  ON sales_records
  FOR SELECT
  TO authenticated
  USING (can_view_all_sales(auth.uid()));

-- All authenticated users can create sales records
CREATE POLICY "sales_insert_authenticated"
  ON sales_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sales records
CREATE POLICY "sales_update_own"
  ON sales_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin and Manager can update any sales record
CREATE POLICY "sales_update_admin"
  ON sales_records
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Only Admin and Manager can delete sales records
CREATE POLICY "sales_delete_admin"
  ON sales_records
  FOR DELETE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- PRODUCTS TABLE POLICIES
-- All authenticated users can read products
CREATE POLICY "products_select_all"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin and Manager can create products
CREATE POLICY "products_insert_admin"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()));

-- Admin and Manager can update products
CREATE POLICY "products_update_admin"
  ON products
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Only Admin can delete products
CREATE POLICY "products_delete_admin"
  ON products
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- CATEGORIES TABLE POLICIES
-- All authenticated users can read categories
CREATE POLICY "categories_select_all"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin and Manager can manage categories
CREATE POLICY "categories_insert_admin"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()));

CREATE POLICY "categories_update_admin"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

CREATE POLICY "categories_delete_admin"
  ON categories
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- SUPPLIERS TABLE POLICIES
-- All authenticated users can read suppliers
CREATE POLICY "suppliers_select_all"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin and Manager can manage suppliers
CREATE POLICY "suppliers_insert_admin"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()));

CREATE POLICY "suppliers_update_admin"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

CREATE POLICY "suppliers_delete_admin"
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- STOCK MOVEMENTS POLICIES
-- Admin, Manager, Chef Teller can view all stock movements
CREATE POLICY "stock_movements_select_privileged"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (can_view_all_sales(auth.uid()));

-- Tellers can only see stock movements they created
CREATE POLICY "stock_movements_select_own"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin and Manager can create stock movements
CREATE POLICY "stock_movements_insert_admin"
  ON stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()) AND auth.uid() = user_id);

-- Admin and Manager can update stock movements
CREATE POLICY "stock_movements_update_admin"
  ON stock_movements
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Only Admin can delete stock movements
CREATE POLICY "stock_movements_delete_admin"
  ON stock_movements
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- PURCHASE ORDERS POLICIES
-- Admin, Manager, Chef Teller can view all purchase orders
CREATE POLICY "purchase_orders_select_privileged"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (can_view_all_sales(auth.uid()));

-- Tellers can only see purchase orders they created
CREATE POLICY "purchase_orders_select_own"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin and Manager can create purchase orders
CREATE POLICY "purchase_orders_insert_admin"
  ON purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_privileges(auth.uid()) AND auth.uid() = user_id);

-- Admin and Manager can update purchase orders
CREATE POLICY "purchase_orders_update_admin"
  ON purchase_orders
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

-- Only Admin can delete purchase orders
CREATE POLICY "purchase_orders_delete_admin"
  ON purchase_orders
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- PURCHASE ORDER ITEMS POLICIES
-- Follow same pattern as purchase orders
CREATE POLICY "purchase_order_items_select_all"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    can_view_all_sales(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
      AND po.user_id = auth.uid()
    )
  );

CREATE POLICY "purchase_order_items_insert_admin"
  ON purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_admin_privileges(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
      AND po.user_id = auth.uid()
    )
  );

CREATE POLICY "purchase_order_items_update_admin"
  ON purchase_order_items
  FOR UPDATE
  TO authenticated
  USING (has_admin_privileges(auth.uid()));

CREATE POLICY "purchase_order_items_delete_admin"
  ON purchase_order_items
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Admin');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anon for registration
GRANT SELECT, INSERT ON users TO anon;

-- Verify setup
DO $$
DECLARE
  table_count integer;
  policy_count integer;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO table_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname IN ('users', 'sales_records', 'products', 'categories', 'suppliers', 'stock_movements', 'purchase_orders', 'purchase_order_items');
  
  -- Count policies created
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'RLS Setup Complete: % tables secured, % policies created', table_count, policy_count;
  
  IF table_count < 8 THEN
    RAISE WARNING 'Not all tables have RLS enabled!';
  END IF;
  
  IF policy_count < 20 THEN
    RAISE WARNING 'Fewer policies than expected were created!';
  END IF;
END $$;