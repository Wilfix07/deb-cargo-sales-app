/*
  # Create Inventory Management System

  1. New Tables
    - `categories` - Product categories with hierarchical support
    - `suppliers` - Supplier information and contacts
    - `products` - Product catalog with stock levels
    - `stock_movements` - Track all inventory movements
    - `purchase_orders` - Purchase orders to suppliers
    - `purchase_order_items` - Items in purchase orders

  2. Features
    - Hierarchical categories
    - Stock level tracking with min/max levels
    - Purchase order management
    - Stock movement history
    - Supplier management

  3. Security
    - Full access granted to authenticated users
    - Proper foreign key constraints
    - Check constraints for data integrity
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table  
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

-- Create products table
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

-- Create stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity integer NOT NULL,
  unit_cost decimal(10,2),
  reference_number text,
  notes text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED')),
  order_date timestamptz NOT NULL DEFAULT now(),
  expected_date timestamptz,
  received_date timestamptz,
  total_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase order items table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT ALL PRIVILEGES ON suppliers TO authenticated;
GRANT ALL PRIVILEGES ON products TO authenticated;
GRANT ALL PRIVILEGES ON stock_movements TO authenticated;
GRANT ALL PRIVILEGES ON purchase_orders TO authenticated;
GRANT ALL PRIVILEGES ON purchase_order_items TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert sample data
INSERT INTO categories (name, description) VALUES 
  ('Elektwonik', 'Aparèy ak akseswa elektwonik'),
  ('Rad ak Chosèt', 'Rad ak akseswa pou moun'),
  ('Kay ak Jaden', 'Bagay pou kay ak jaden'),
  ('Manje ak Bweson', 'Pwodwi alimentè ak bweson'),
  ('Sante ak Bote', 'Pwodwi sante ak kosmetik')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES 
  ('Tech Distributors Inc', 'John Smith', 'john@techdist.com', '+1-555-0123', '123 Tech Street, Miami, FL'),
  ('Fashion Wholesale Co', 'Maria Garcia', 'maria@fashionwholesale.com', '+1-555-0456', '456 Fashion Ave, New York, NY'),
  ('Home & Garden Supply', 'Robert Johnson', 'robert@homegardens.com', '+1-555-0789', '789 Garden Blvd, Atlanta, GA')
ON CONFLICT DO NOTHING;

-- Insert sample products
DO $$
DECLARE
  cat_electronics uuid;
  cat_clothing uuid;
  cat_home uuid;
  sup_tech uuid;
  sup_fashion uuid;
  sup_home uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_electronics FROM categories WHERE name = 'Elektwonik' LIMIT 1;
  SELECT id INTO cat_clothing FROM categories WHERE name = 'Rad ak Chosèt' LIMIT 1;
  SELECT id INTO cat_home FROM categories WHERE name = 'Kay ak Jaden' LIMIT 1;
  
  -- Get supplier IDs
  SELECT id INTO sup_tech FROM suppliers WHERE name = 'Tech Distributors Inc' LIMIT 1;
  SELECT id INTO sup_fashion FROM suppliers WHERE name = 'Fashion Wholesale Co' LIMIT 1;
  SELECT id INTO sup_home FROM suppliers WHERE name = 'Home & Garden Supply' LIMIT 1;
  
  -- Insert sample products
  INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode) VALUES 
    ('PHONE001', 'iPhone 15 Pro', 'Apple iPhone 15 Pro 128GB', cat_electronics, sup_tech, 999.99, 750.00, 25, 5, 50, 'pcs', '1234567890123'),
    ('LAPTOP001', 'MacBook Air M2', 'Apple MacBook Air 13" M2 256GB', cat_electronics, sup_tech, 1199.99, 900.00, 15, 3, 30, 'pcs', '1234567890124'),
    ('SHIRT001', 'Cotton T-Shirt', 'Premium Cotton T-Shirt - Various Colors', cat_clothing, sup_fashion, 29.99, 15.00, 100, 20, 200, 'pcs', '1234567890125'),
    ('CHAIR001', 'Office Chair', 'Ergonomic Office Chair with Lumbar Support', cat_home, sup_home, 199.99, 120.00, 12, 5, 25, 'pcs', '1234567890126'),
    ('DESK001', 'Standing Desk', 'Adjustable Height Standing Desk', cat_home, sup_home, 399.99, 250.00, 8, 2, 15, 'pcs', '1234567890127')
  ON CONFLICT (code) DO NOTHING;
END $$;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  order_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 3) AS integer)), 0) + 1
  INTO next_num
  FROM purchase_orders
  WHERE order_number ~ '^PO[0-9]+$';
  
  order_num := 'PO' || LPAD(next_num::text, 6, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;