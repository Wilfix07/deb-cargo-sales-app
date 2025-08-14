import { supabase } from '../lib/supabase';

export class DatabaseSetupService {
  private async executeSQL(sql: string, description: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Executing: ${description}`);
      
      // Use Supabase's RPC function to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: sql 
      });
      
      if (error) {
        console.error(`Error in ${description}:`, error);
        return { success: false, error: error.message };
      }
      
      console.log(`✓ ${description} completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`Unexpected error in ${description}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createExecuteSQLFunction(): Promise<{ success: boolean; error?: string }> {
    try {
      // Create the exec_sql function that we'll use for other operations
      const { error } = await supabase.rpc('exec_sql', {
        query: `
          CREATE OR REPLACE FUNCTION exec_sql(query text)
          RETURNS void AS $$
          BEGIN
            EXECUTE query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });

      if (error) {
        // If the function doesn't exist, try to create it directly
        console.log('Creating exec_sql function directly...');
        
        // Try alternative approach using direct SQL execution
        const { error: directError } = await supabase
          .from('pg_stat_user_tables')
          .select('*')
          .limit(1);

        if (directError) {
          return { success: false, error: 'Cannot create exec_sql function. Database access may be restricted.' };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createCustomTypes(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create custom types if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Chef Teller', 'Teller');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_type') THEN
          CREATE TYPE scan_type AS ENUM ('qr', 'barcode', 'manual');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
          CREATE TYPE movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          CREATE TYPE order_status AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED');
        END IF;
      END $$;
    `;
    
    return this.executeSQL(sql, 'Creating custom types');
  }

  async createUsersTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        username text UNIQUE NOT NULL,
        email text UNIQUE NOT NULL,
        full_name text NOT NULL,
        role user_role NOT NULL DEFAULT 'Teller',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        last_login timestamptz
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    `;
    
    return this.executeSQL(sql, 'Creating users table');
  }

  async createCategoriesTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create categories table if it doesn't exist
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
    `;
    
    return this.executeSQL(sql, 'Creating categories table');
  }

  async createSuppliersTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create suppliers table if it doesn't exist
      CREATE TABLE IF NOT EXISTS suppliers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        contact_person text,
        email text,
        phone text,
        address text,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
      CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
      CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
    `;
    
    return this.executeSQL(sql, 'Creating suppliers table');
  }

  async createProductsTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create products table if it doesn't exist
      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text UNIQUE NOT NULL,
        name text NOT NULL,
        description text,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
        unit_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
        cost_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
        current_stock integer NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
        min_stock_level integer NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
        max_stock_level integer NOT NULL DEFAULT 0 CHECK (max_stock_level >= 0),
        unit_of_measure text NOT NULL DEFAULT 'pcs',
        barcode text,
        image_url text,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    `;
    
    return this.executeSQL(sql, 'Creating products table');
  }

  async createSalesRecordsTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create sales_records table if it doesn't exist
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_sales_records_created_at ON sales_records(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_records_product_code ON sales_records(product_code);
      CREATE INDEX IF NOT EXISTS idx_sales_records_customer_name ON sales_records(customer_name);
    `;
    
    return this.executeSQL(sql, 'Creating sales_records table');
  }

  async createStockMovementsTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create stock_movements table if it doesn't exist
      CREATE TABLE IF NOT EXISTS stock_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        movement_type movement_type NOT NULL,
        quantity integer NOT NULL,
        unit_cost decimal(10,2),
        reference_number text,
        notes text,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
    `;
    
    return this.executeSQL(sql, 'Creating stock_movements table');
  }

  async createPurchaseOrdersTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create purchase_orders table if it doesn't exist
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number text UNIQUE NOT NULL,
        supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
        status order_status NOT NULL DEFAULT 'DRAFT',
        order_date timestamptz NOT NULL DEFAULT now(),
        expected_date timestamptz,
        received_date timestamptz,
        total_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
        notes text,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);
    `;
    
    return this.executeSQL(sql, 'Creating purchase_orders table');
  }

  async createPurchaseOrderItemsTable(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create purchase_order_items table if it doesn't exist
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
        quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
        unit_cost decimal(10,2) NOT NULL CHECK (unit_cost >= 0),
        total_cost decimal(10,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED,
        created_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);
    `;
    
    return this.executeSQL(sql, 'Creating purchase_order_items table');
  }

  async createTriggers(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for updated_at columns
      DO $$
      BEGIN
        -- Categories trigger
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
          CREATE TRIGGER update_categories_updated_at
            BEFORE UPDATE ON categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Suppliers trigger
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
          CREATE TRIGGER update_suppliers_updated_at
            BEFORE UPDATE ON suppliers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Products trigger
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
          CREATE TRIGGER update_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Purchase orders trigger
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_orders_updated_at') THEN
          CREATE TRIGGER update_purchase_orders_updated_at
            BEFORE UPDATE ON purchase_orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;

      -- Create function to handle new user creation
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
          is_active = EXCLUDED.is_active;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create trigger for new user creation
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    return this.executeSQL(sql, 'Creating triggers and functions');
  }

  async setupRLS(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Enable RLS on all tables
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

      -- Helper functions for RLS policies
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
    `;
    
    return this.executeSQL(sql, 'Setting up RLS and helper functions');
  }

  async createRLSPolicies(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "users_select_own" ON users;
      DROP POLICY IF EXISTS "users_select_admin" ON users;
      DROP POLICY IF EXISTS "users_update_own" ON users;
      DROP POLICY IF EXISTS "users_update_admin" ON users;
      DROP POLICY IF EXISTS "users_insert_registration" ON users;
      DROP POLICY IF EXISTS "users_delete_admin" ON users;

      -- Users table policies
      CREATE POLICY "users_select_own"
        ON users FOR SELECT TO authenticated
        USING (auth.uid() = id);

      CREATE POLICY "users_select_admin"
        ON users FOR SELECT TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "users_update_own"
        ON users FOR UPDATE TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

      CREATE POLICY "users_update_admin"
        ON users FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "users_insert_registration"
        ON users FOR INSERT TO public
        WITH CHECK (true);

      CREATE POLICY "users_delete_admin"
        ON users FOR DELETE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      -- Sales records policies
      DROP POLICY IF EXISTS "sales_select_own" ON sales_records;
      DROP POLICY IF EXISTS "sales_select_all_privileged" ON sales_records;
      DROP POLICY IF EXISTS "sales_insert_authenticated" ON sales_records;
      DROP POLICY IF EXISTS "sales_update_own" ON sales_records;
      DROP POLICY IF EXISTS "sales_update_admin" ON sales_records;
      DROP POLICY IF EXISTS "sales_delete_admin" ON sales_records;

      CREATE POLICY "sales_select_own"
        ON sales_records FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "sales_select_all_privileged"
        ON sales_records FOR SELECT TO authenticated
        USING (can_view_all_sales(auth.uid()));

      CREATE POLICY "sales_insert_authenticated"
        ON sales_records FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "sales_update_own"
        ON sales_records FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "sales_update_admin"
        ON sales_records FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "sales_delete_admin"
        ON sales_records FOR DELETE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      -- Products table policies
      DROP POLICY IF EXISTS "products_select_all" ON products;
      DROP POLICY IF EXISTS "products_insert_admin" ON products;
      DROP POLICY IF EXISTS "products_update_admin" ON products;
      DROP POLICY IF EXISTS "products_delete_admin" ON products;

      CREATE POLICY "products_select_all"
        ON products FOR SELECT TO authenticated
        USING (true);

      CREATE POLICY "products_insert_admin"
        ON products FOR INSERT TO authenticated
        WITH CHECK (has_admin_privileges(auth.uid()));

      CREATE POLICY "products_update_admin"
        ON products FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "products_delete_admin"
        ON products FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');

      -- Categories table policies
      DROP POLICY IF EXISTS "categories_select_all" ON categories;
      DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
      DROP POLICY IF EXISTS "categories_update_admin" ON categories;
      DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

      CREATE POLICY "categories_select_all"
        ON categories FOR SELECT TO authenticated
        USING (true);

      CREATE POLICY "categories_insert_admin"
        ON categories FOR INSERT TO authenticated
        WITH CHECK (has_admin_privileges(auth.uid()));

      CREATE POLICY "categories_update_admin"
        ON categories FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "categories_delete_admin"
        ON categories FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');

      -- Suppliers table policies
      DROP POLICY IF EXISTS "suppliers_select_all" ON suppliers;
      DROP POLICY IF EXISTS "suppliers_insert_admin" ON suppliers;
      DROP POLICY IF EXISTS "suppliers_update_admin" ON suppliers;
      DROP POLICY IF EXISTS "suppliers_delete_admin" ON suppliers;

      CREATE POLICY "suppliers_select_all"
        ON suppliers FOR SELECT TO authenticated
        USING (true);

      CREATE POLICY "suppliers_insert_admin"
        ON suppliers FOR INSERT TO authenticated
        WITH CHECK (has_admin_privileges(auth.uid()));

      CREATE POLICY "suppliers_update_admin"
        ON suppliers FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "suppliers_delete_admin"
        ON suppliers FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');

      -- Stock movements policies
      DROP POLICY IF EXISTS "stock_movements_select_privileged" ON stock_movements;
      DROP POLICY IF EXISTS "stock_movements_select_own" ON stock_movements;
      DROP POLICY IF EXISTS "stock_movements_insert_admin" ON stock_movements;
      DROP POLICY IF EXISTS "stock_movements_update_admin" ON stock_movements;
      DROP POLICY IF EXISTS "stock_movements_delete_admin" ON stock_movements;

      CREATE POLICY "stock_movements_select_privileged"
        ON stock_movements FOR SELECT TO authenticated
        USING (can_view_all_sales(auth.uid()));

      CREATE POLICY "stock_movements_select_own"
        ON stock_movements FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "stock_movements_insert_admin"
        ON stock_movements FOR INSERT TO authenticated
        WITH CHECK (has_admin_privileges(auth.uid()) AND auth.uid() = user_id);

      CREATE POLICY "stock_movements_update_admin"
        ON stock_movements FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "stock_movements_delete_admin"
        ON stock_movements FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');

      -- Purchase orders policies
      DROP POLICY IF EXISTS "purchase_orders_select_privileged" ON purchase_orders;
      DROP POLICY IF EXISTS "purchase_orders_select_own" ON purchase_orders;
      DROP POLICY IF EXISTS "purchase_orders_insert_admin" ON purchase_orders;
      DROP POLICY IF EXISTS "purchase_orders_update_admin" ON purchase_orders;
      DROP POLICY IF EXISTS "purchase_orders_delete_admin" ON purchase_orders;

      CREATE POLICY "purchase_orders_select_privileged"
        ON purchase_orders FOR SELECT TO authenticated
        USING (can_view_all_sales(auth.uid()));

      CREATE POLICY "purchase_orders_select_own"
        ON purchase_orders FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "purchase_orders_insert_admin"
        ON purchase_orders FOR INSERT TO authenticated
        WITH CHECK (has_admin_privileges(auth.uid()) AND auth.uid() = user_id);

      CREATE POLICY "purchase_orders_update_admin"
        ON purchase_orders FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "purchase_orders_delete_admin"
        ON purchase_orders FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');

      -- Purchase order items policies
      DROP POLICY IF EXISTS "purchase_order_items_select_all" ON purchase_order_items;
      DROP POLICY IF EXISTS "purchase_order_items_insert_admin" ON purchase_order_items;
      DROP POLICY IF EXISTS "purchase_order_items_update_admin" ON purchase_order_items;
      DROP POLICY IF EXISTS "purchase_order_items_delete_admin" ON purchase_order_items;

      CREATE POLICY "purchase_order_items_select_all"
        ON purchase_order_items FOR SELECT TO authenticated
        USING (
          can_view_all_sales(auth.uid()) OR
          EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_items.purchase_order_id
            AND po.user_id = auth.uid()
          )
        );

      CREATE POLICY "purchase_order_items_insert_admin"
        ON purchase_order_items FOR INSERT TO authenticated
        WITH CHECK (
          has_admin_privileges(auth.uid()) AND
          EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_items.purchase_order_id
            AND po.user_id = auth.uid()
          )
        );

      CREATE POLICY "purchase_order_items_update_admin"
        ON purchase_order_items FOR UPDATE TO authenticated
        USING (has_admin_privileges(auth.uid()));

      CREATE POLICY "purchase_order_items_delete_admin"
        ON purchase_order_items FOR DELETE TO authenticated
        USING (get_user_role(auth.uid()) = 'Admin');
    `;
    
    return this.executeSQL(sql, 'Creating RLS policies');
  }

  async insertSampleData(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Insert sample categories
      INSERT INTO categories (name, description, is_active) VALUES 
        ('Electronics', 'Aparèy elektwonik ak teknoloji', true),
        ('Clothing', 'Rad ak akseswa', true),
        ('Food & Beverages', 'Manje ak bweson', true),
        ('Home & Garden', 'Bagay pou kay ak jaden', true),
        ('Sports & Outdoors', 'Ekipman pou espò ak deyò', true),
        ('Books & Media', 'Liv ak medya', true),
        ('Health & Beauty', 'Sante ak bote', true),
        ('Automotive', 'Bagay pou machin', true)
      ON CONFLICT (name) DO NOTHING;

      -- Insert sample suppliers
      INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES 
        ('Tech Solutions Inc', 'Jean Baptiste', 'jean@techsolutions.com', '+509 1234-5678', 'Port-au-Prince, Haiti', true),
        ('Fashion Distributors', 'Marie Dupont', 'marie@fashiondist.com', '+509 2345-6789', 'Cap-Haïtien, Haiti', true),
        ('Food Wholesale Co', 'Pierre Louis', 'pierre@foodwholesale.com', '+509 3456-7890', 'Les Cayes, Haiti', true),
        ('Home Essentials', 'Anne Michel', 'anne@homeessentials.com', '+509 4567-8901', 'Gonaïves, Haiti', true),
        ('Sports Equipment Ltd', 'Paul Morin', 'paul@sportsequip.com', '+509 5678-9012', 'Jacmel, Haiti', true),
        ('Book Paradise', 'Sophie Celestin', 'sophie@bookparadise.com', '+509 6789-0123', 'Port-au-Prince, Haiti', true),
        ('Beauty Supply Co', 'Carla Joseph', 'carla@beautysupply.com', '+509 7890-1234', 'Pétion-Ville, Haiti', true),
        ('Auto Parts Plus', 'Robert Francois', 'robert@autoparts.com', '+509 8901-2345', 'Delmas, Haiti', true)
      ON CONFLICT (name) DO NOTHING;

      -- Insert sample products
      DO $$
      DECLARE
        electronics_id uuid;
        clothing_id uuid;
        food_id uuid;
        home_id uuid;
        sports_id uuid;
        books_id uuid;
        health_id uuid;
        auto_id uuid;
        tech_supplier_id uuid;
        fashion_supplier_id uuid;
        food_supplier_id uuid;
        home_supplier_id uuid;
        sports_supplier_id uuid;
        book_supplier_id uuid;
        beauty_supplier_id uuid;
        auto_supplier_id uuid;
      BEGIN
        -- Get category IDs
        SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
        SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
        SELECT id INTO food_id FROM categories WHERE name = 'Food & Beverages' LIMIT 1;
        SELECT id INTO home_id FROM categories WHERE name = 'Home & Garden' LIMIT 1;
        SELECT id INTO sports_id FROM categories WHERE name = 'Sports & Outdoors' LIMIT 1;
        SELECT id INTO books_id FROM categories WHERE name = 'Books & Media' LIMIT 1;
        SELECT id INTO health_id FROM categories WHERE name = 'Health & Beauty' LIMIT 1;
        SELECT id INTO auto_id FROM categories WHERE name = 'Automotive' LIMIT 1;
        
        -- Get supplier IDs
        SELECT id INTO tech_supplier_id FROM suppliers WHERE name = 'Tech Solutions Inc' LIMIT 1;
        SELECT id INTO fashion_supplier_id FROM suppliers WHERE name = 'Fashion Distributors' LIMIT 1;
        SELECT id INTO food_supplier_id FROM suppliers WHERE name = 'Food Wholesale Co' LIMIT 1;
        SELECT id INTO home_supplier_id FROM suppliers WHERE name = 'Home Essentials' LIMIT 1;
        SELECT id INTO sports_supplier_id FROM suppliers WHERE name = 'Sports Equipment Ltd' LIMIT 1;
        SELECT id INTO book_supplier_id FROM suppliers WHERE name = 'Book Paradise' LIMIT 1;
        SELECT id INTO beauty_supplier_id FROM suppliers WHERE name = 'Beauty Supply Co' LIMIT 1;
        SELECT id INTO auto_supplier_id FROM suppliers WHERE name = 'Auto Parts Plus' LIMIT 1;
        
        -- Insert sample products
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES 
          -- Electronics
          ('ELEC001', 'Samsung Galaxy Phone', 'Telefòn entèlijan Samsung ak karaktè modèn yo', electronics_id, tech_supplier_id, 599.99, 450.00, 25, 5, 50, 'pcs', '1234567890123', true),
          ('ELEC002', 'Apple iPhone', 'iPhone ak teknoloji pi resan an', electronics_id, tech_supplier_id, 899.99, 700.00, 15, 3, 30, 'pcs', '1234567890124', true),
          ('ELEC003', 'Laptop Dell', 'Òdinatè pòtatif pou travay ak etid', electronics_id, tech_supplier_id, 1299.99, 1000.00, 8, 2, 20, 'pcs', '1234567890125', true),
          ('ELEC004', 'Bluetooth Headphones', 'Ekoutè san fil ak son kalite wo', electronics_id, tech_supplier_id, 89.99, 60.00, 45, 10, 100, 'pcs', '1234567890126', true),
          ('ELEC005', 'Smart TV 55"', 'Televizyon entèlijan 55 pous', electronics_id, tech_supplier_id, 799.99, 600.00, 12, 3, 25, 'pcs', '1234567890127', true),
          
          -- Clothing
          ('CLTH001', 'Men T-Shirt', 'T-shirt pou gason ak kalite bon', clothing_id, fashion_supplier_id, 19.99, 12.00, 150, 20, 300, 'pcs', '2234567890123', true),
          ('CLTH002', 'Women Dress', 'Rob pou fanm ak estil modèn', clothing_id, fashion_supplier_id, 49.99, 30.00, 75, 15, 150, 'pcs', '2234567890124', true),
          ('CLTH003', 'Jeans Pants', 'Pantalon jeans ak kalite wo', clothing_id, fashion_supplier_id, 39.99, 25.00, 100, 20, 200, 'pcs', '2234567890125', true),
          ('CLTH004', 'Sneakers', 'Soulye espò ak konfò', clothing_id, fashion_supplier_id, 79.99, 50.00, 60, 10, 120, 'pcs', '2234567890126', true),
          ('CLTH005', 'Baseball Cap', 'Chapo ak estil espò', clothing_id, fashion_supplier_id, 24.99, 15.00, 80, 15, 160, 'pcs', '2234567890127', true),
          
          -- Food & Beverages
          ('FOOD001', 'Rice 25lb', 'Diri ak kalite bon 25 liv', food_id, food_supplier_id, 18.99, 12.00, 200, 30, 500, 'bag', '3234567890123', true),
          ('FOOD002', 'Cooking Oil 1L', 'Lwil pou kwit manje 1 lit', food_id, food_supplier_id, 4.99, 3.00, 180, 25, 400, 'bottle', '3234567890124', true),
          ('FOOD003', 'Canned Beans', 'Pwa nan bwat konsèv', food_id, food_supplier_id, 2.49, 1.50, 300, 50, 600, 'can', '3234567890125', true),
          ('FOOD004', 'Bottled Water 24pk', 'Dlo nan boutèy pak 24', food_id, food_supplier_id, 6.99, 4.00, 120, 20, 250, 'pack', '3234567890126', true),
          ('FOOD005', 'Coffee Beans 1lb', 'Grenn kafe 1 liv', food_id, food_supplier_id, 12.99, 8.00, 85, 15, 200, 'bag', '3234567890127', true),
          
          -- Home & Garden
          ('HOME001', 'Garden Hose 50ft', 'Tiyò jaden 50 pye', home_id, home_supplier_id, 29.99, 18.00, 40, 8, 80, 'pcs', '4234567890123', true),
          ('HOME002', 'Lawn Mower', 'Machin pou koupe zèb', home_id, home_supplier_id, 299.99, 200.00, 15, 3, 30, 'pcs', '4234567890124', true),
          ('HOME003', 'Plant Fertilizer', 'Angre pou plant yo', home_id, home_supplier_id, 14.99, 9.00, 90, 15, 180, 'bag', '4234567890125', true),
          ('HOME004', 'Garden Tools Set', 'Zouti jaden yo nan yon sèt', home_id, home_supplier_id, 49.99, 30.00, 25, 5, 50, 'set', '4234567890126', true),
          ('HOME005', 'Outdoor Chair', 'Chèz pou deyò ak konfò', home_id, home_supplier_id, 89.99, 60.00, 35, 8, 70, 'pcs', '4234567890127', true),
          
          -- Sports & Outdoors
          ('SPRT001', 'Basketball', 'Boul basket ak kalite pwofesyonèl', sports_id, sports_supplier_id, 24.99, 15.00, 50, 10, 100, 'pcs', '5234567890123', true),
          ('SPRT002', 'Soccer Ball', 'Boul foutbòl ak estanda FIFA', sports_id, sports_supplier_id, 19.99, 12.00, 60, 12, 120, 'pcs', '5234567890124', true),
          ('SPRT003', 'Tennis Racket', 'Raket tenis ak teknoloji modèn', sports_id, sports_supplier_id, 89.99, 60.00, 20, 5, 40, 'pcs', '5234567890125', true),
          ('SPRT004', 'Camping Tent', 'Tant pou kanpe ak 4 moun', sports_id, sports_supplier_id, 149.99, 100.00, 18, 4, 35, 'pcs', '5234567890126', true),
          ('SPRT005', 'Fishing Rod', 'Kan pou pèch ak akseswa', sports_id, sports_supplier_id, 69.99, 45.00, 30, 6, 60, 'pcs', '5234567890127', true),
          
          -- Books & Media
          ('BOOK001', 'Programming Book', 'Liv sou pwogramasyon ak egzanp yo', books_id, book_supplier_id, 39.99, 25.00, 40, 8, 80, 'pcs', '6234567890123', true),
          ('BOOK002', 'History of Haiti', 'Liv sou istwa Ayiti', books_id, book_supplier_id, 24.99, 15.00, 55, 10, 110, 'pcs', '6234567890124', true),
          ('BOOK003', 'Cooking Magazine', 'Magazin sou kwizin ak resèt yo', books_id, book_supplier_id, 4.99, 3.00, 100, 20, 200, 'pcs', '6234567890125', true),
          ('BOOK004', 'Music CD Collection', 'Koleksyon CD ak mizik popilè', books_id, book_supplier_id, 14.99, 9.00, 75, 15, 150, 'pcs', '6234567890126', true),
          ('BOOK005', 'Educational DVD', 'DVD ak kontni edikatif', books_id, book_supplier_id, 19.99, 12.00, 45, 9, 90, 'pcs', '6234567890127', true),
          
          -- Health & Beauty
          ('HLTH001', 'Shampoo 500ml', 'Chanpou ak fòmil natirèl', health_id, beauty_supplier_id, 8.99, 5.00, 120, 20, 240, 'bottle', '7234567890123', true),
          ('HLTH002', 'Face Cream', 'Krèm pou figi ak pwoteksyon', health_id, beauty_supplier_id, 24.99, 15.00, 80, 15, 160, 'jar', '7234567890124', true),
          ('HLTH003', 'Vitamins 60ct', 'Vitamin ak 60 konprè', health_id, beauty_supplier_id, 19.99, 12.00, 95, 18, 190, 'bottle', '7234567890125', true),
          ('HLTH004', 'Toothpaste', 'Dentifris ak pwoteksyon konplè', health_id, beauty_supplier_id, 3.99, 2.50, 200, 30, 400, 'tube', '7234567890126', true),
          ('HLTH005', 'Hand Sanitizer', 'Dezenfèktan pou men ak 70% alkòl', health_id, beauty_supplier_id, 5.99, 3.50, 150, 25, 300, 'bottle', '7234567890127', true),
          
          -- Automotive
          ('AUTO001', 'Motor Oil 5L', 'Lwil motè 5 lit ak kalite wo', auto_id, auto_supplier_id, 29.99, 18.00, 60, 12, 120, 'bottle', '8234567890123', true),
          ('AUTO002', 'Car Battery', 'Batri machin ak garanti 2 ane', auto_id, auto_supplier_id, 89.99, 60.00, 25, 5, 50, 'pcs', '8234567890124', true),
          ('AUTO003', 'Brake Pads', 'Plak fren ak teknoloji modèn', auto_id, auto_supplier_id, 49.99, 30.00, 40, 8, 80, 'set', '8234567890125', true),
          ('AUTO004', 'Air Filter', 'Filt lè pou motè ak pwoteksyon', auto_id, auto_supplier_id, 14.99, 9.00, 70, 14, 140, 'pcs', '8234567890126', true),
          ('AUTO005', 'Windshield Wipers', 'Esui-glace ak teknoloji modèn', auto_id, auto_supplier_id, 19.99, 12.00, 55, 11, 110, 'pair', '8234567890127', true)
        ON CONFLICT (code) DO NOTHING;
      END $$;
    `;
    
    return this.executeSQL(sql, 'Inserting sample data');
  }

  async grantPermissions(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Grant comprehensive permissions
      GRANT USAGE ON SCHEMA public TO authenticated, anon;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

      -- Grant limited permissions to anon for registration
      GRANT SELECT, INSERT ON users TO anon;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
    `;
    
    return this.executeSQL(sql, 'Granting permissions');
  }

  async setupCompleteDatabase(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🚀 Starting complete database setup...');

    // Step 1: Create custom types
    const typesResult = await this.createCustomTypes();
    if (!typesResult.success) {
      errors.push(`Custom types: ${typesResult.error}`);
    }

    // Step 2: Create tables in dependency order
    const tablesResults = await Promise.all([
      this.createUsersTable(),
      this.createCategoriesTable(),
      this.createSuppliersTable()
    ]);

    tablesResults.forEach((result, index) => {
      if (!result.success) {
        const tableNames = ['users', 'categories', 'suppliers'];
        errors.push(`${tableNames[index]} table: ${result.error}`);
      }
    });

    // Step 3: Create dependent tables
    const dependentTablesResults = await Promise.all([
      this.createProductsTable(),
      this.createSalesRecordsTable(),
      this.createStockMovementsTable(),
      this.createPurchaseOrdersTable()
    ]);

    dependentTablesResults.forEach((result, index) => {
      if (!result.success) {
        const tableNames = ['products', 'sales_records', 'stock_movements', 'purchase_orders'];
        errors.push(`${tableNames[index]} table: ${result.error}`);
      }
    });

    // Step 4: Create final dependent table
    const itemsResult = await this.createPurchaseOrderItemsTable();
    if (!itemsResult.success) {
      errors.push(`purchase_order_items table: ${itemsResult.error}`);
    }

    // Step 5: Add explicit foreign key constraints
    const foreignKeysResult = await this.addForeignKeys();
    if (!foreignKeysResult.success) {
      errors.push(`Foreign keys: ${foreignKeysResult.error}`);
    }

    // Step 6: Create triggers
    const triggersResult = await this.createTriggers();
    if (!triggersResult.success) {
      errors.push(`Triggers: ${triggersResult.error}`);
    }

    // Step 7: Setup RLS
    const rlsResult = await this.setupRLS();
    if (!rlsResult.success) {
      errors.push(`RLS setup: ${rlsResult.error}`);
    }

    // Step 8: Create RLS policies
    const policiesResult = await this.createRLSPolicies();
    if (!policiesResult.success) {
      errors.push(`RLS policies: ${policiesResult.error}`);
    }

    // Step 9: Grant permissions
    const permissionsResult = await this.grantPermissions();
    if (!permissionsResult.success) {
      errors.push(`Permissions: ${permissionsResult.error}`);
    }

    // Step 10: Insert sample data
    const sampleDataResult = await this.insertSampleData();
    if (!sampleDataResult.success) {
      errors.push(`Sample data: ${sampleDataResult.error}`);
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log('✅ Database setup completed successfully!');
    } else {
      console.log('⚠️ Database setup completed with some errors:', errors);
    }

    return { success, errors };
  }

  async addForeignKeys(): Promise<{ success: boolean; error?: string }> {
    const sql = `
      -- Add foreign key constraints explicitly
      DO $$
      BEGIN
        -- Add foreign key for products.category_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'products_category_id_fkey' 
          AND table_name = 'products'
        ) THEN
          ALTER TABLE products 
          ADD CONSTRAINT products_category_id_fkey 
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
        END IF;

        -- Add foreign key for products.supplier_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'products_supplier_id_fkey' 
          AND table_name = 'products'
        ) THEN
          ALTER TABLE products 
          ADD CONSTRAINT products_supplier_id_fkey 
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
        END IF;

        -- Add foreign key for sales_records.user_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'sales_records_user_id_fkey' 
          AND table_name = 'sales_records'
        ) THEN
          ALTER TABLE sales_records 
          ADD CONSTRAINT sales_records_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for stock_movements.product_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'stock_movements_product_id_fkey' 
          AND table_name = 'stock_movements'
        ) THEN
          ALTER TABLE stock_movements 
          ADD CONSTRAINT stock_movements_product_id_fkey 
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for stock_movements.user_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'stock_movements_user_id_fkey' 
          AND table_name = 'stock_movements'
        ) THEN
          ALTER TABLE stock_movements 
          ADD CONSTRAINT stock_movements_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for purchase_orders.supplier_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'purchase_orders_supplier_id_fkey' 
          AND table_name = 'purchase_orders'
        ) THEN
          ALTER TABLE purchase_orders 
          ADD CONSTRAINT purchase_orders_supplier_id_fkey 
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT;
        END IF;

        -- Add foreign key for purchase_orders.user_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'purchase_orders_user_id_fkey' 
          AND table_name = 'purchase_orders'
        ) THEN
          ALTER TABLE purchase_orders 
          ADD CONSTRAINT purchase_orders_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for purchase_order_items.purchase_order_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'purchase_order_items_purchase_order_id_fkey' 
          AND table_name = 'purchase_order_items'
        ) THEN
          ALTER TABLE purchase_order_items 
          ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey 
          FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for purchase_order_items.product_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'purchase_order_items_product_id_fkey' 
          AND table_name = 'purchase_order_items'
        ) THEN
          ALTER TABLE purchase_order_items 
          ADD CONSTRAINT purchase_order_items_product_id_fkey 
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for categories.parent_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'categories_parent_id_fkey' 
          AND table_name = 'categories'
        ) THEN
          ALTER TABLE categories 
          ADD CONSTRAINT categories_parent_id_fkey 
          FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `;
    
    return this.executeSQL(sql, 'Adding explicit foreign key constraints');
  }

  async verifyDatabaseSetup(): Promise<{ success: boolean; tables: string[]; error?: string }> {
    try {
      // Check if tables exist using Supabase client
      const tableChecks = await Promise.all([
        supabase.from('users').select('id').limit(1),
        supabase.from('sales_records').select('id').limit(1),
        supabase.from('products').select('id').limit(1),
        supabase.from('categories').select('id').limit(1),
        supabase.from('suppliers').select('id').limit(1),
        supabase.from('stock_movements').select('id').limit(1),
        supabase.from('purchase_orders').select('id').limit(1),
        supabase.from('purchase_order_items').select('id').limit(1)
      ]);

      const tableNames = [
        'users', 'sales_records', 'products', 'categories', 
        'suppliers', 'stock_movements', 'purchase_orders', 'purchase_order_items'
      ];

      const existingTables: string[] = [];
      
      tableChecks.forEach((result, index) => {
        if (!result.error) {
          existingTables.push(tableNames[index]);
        }
      });

      return { success: true, tables: existingTables };
    } catch (error) {
      return { 
        success: false, 
        tables: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Alternative method using direct Supabase API calls
  async createTablesViaAPI(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Create users table using direct API
      const { error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (usersError && usersError.message.includes('relation "public.users" does not exist')) {
        // Table doesn't exist, we need to create it via SQL
        console.log('Users table does not exist, creating via SQL...');
        const createResult = await this.createUsersTable();
        if (!createResult.success) {
          errors.push(`Users table: ${createResult.error}`);
        }
      }

      // Similar checks for other tables...
      const tables = [
        { name: 'categories', createFn: this.createCategoriesTable },
        { name: 'suppliers', createFn: this.createSuppliersTable },
        { name: 'products', createFn: this.createProductsTable },
        { name: 'sales_records', createFn: this.createSalesRecordsTable },
        { name: 'stock_movements', createFn: this.createStockMovementsTable },
        { name: 'purchase_orders', createFn: this.createPurchaseOrdersTable },
        { name: 'purchase_order_items', createFn: this.createPurchaseOrderItemsTable }
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);

        if (error && error.message.includes(`relation "public.${table.name}" does not exist`)) {
          console.log(`${table.name} table does not exist, creating...`);
          const createResult = await table.createFn.call(this);
          if (!createResult.success) {
            errors.push(`${table.name} table: ${createResult.error}`);
          }
        }
      }

    } catch (error) {
      errors.push(`API setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success: errors.length === 0, errors };
  }

  // Method to create sample sales records
  async createSampleSalesRecords(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get admin user
      const { data: adminUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Admin')
        .limit(1)
        .single();

      if (userError || !adminUser) {
        return { success: false, error: 'No admin user found for creating sample data' };
      }

      // Get some products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, code, name, unit_price')
        .eq('is_active', true)
        .limit(10);

      if (productsError || !products || products.length === 0) {
        return { success: false, error: 'No products found for creating sample sales' };
      }

      // Create sample sales records
      const sampleSales = products.map((product, index) => ({
        product_code: product.code,
        product_name: product.name,
        quantity: Math.floor(Math.random() * 5) + 1,
        unit_price: product.unit_price,
        total_amount: (Math.floor(Math.random() * 5) + 1) * product.unit_price,
        customer_name: ['Jean Baptiste', 'Marie Dupont', 'Pierre Louis', 'Anne Michel', 'Paul Morin'][index % 5],
        scan_type: ['manual', 'barcode', 'qr'][index % 3] as 'manual' | 'barcode' | 'qr',
        user_id: adminUser.id,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const { error: insertError } = await supabase
        .from('sales_records')
        .insert(sampleSales);

      if (insertError) {
        return { success: false, error: `Error creating sample sales: ${insertError.message}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Method to create sample stock movements
  async createSampleStockMovements(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get admin user
      const { data: adminUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Admin')
        .limit(1)
        .single();

      if (userError || !adminUser) {
        return { success: false, error: 'No admin user found for creating sample data' };
      }

      // Get some products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, current_stock')
        .eq('is_active', true)
        .limit(5);

      if (productsError || !products || products.length === 0) {
        return { success: false, error: 'No products found for creating sample stock movements' };
      }

      // Create sample stock movements
      const sampleMovements = products.flatMap(product => [
        {
          product_id: product.id,
          movement_type: 'IN' as const,
          quantity: Math.floor(Math.random() * 50) + 10,
          unit_cost: Math.random() * 20 + 5,
          reference_number: `PO-${Math.floor(Math.random() * 9999) + 1000}`,
          notes: 'Resèpsyon stock nouvo',
          user_id: adminUser.id,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          product_id: product.id,
          movement_type: 'OUT' as const,
          quantity: Math.floor(Math.random() * 10) + 1,
          reference_number: `SALE-${Math.floor(Math.random() * 9999) + 1000}`,
          notes: 'Vant nan magazen',
          user_id: adminUser.id,
          created_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(sampleMovements);

      if (insertError) {
        return { success: false, error: `Error creating sample stock movements: ${insertError.message}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}