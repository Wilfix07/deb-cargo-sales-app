-- Add payment tracking fields and update sale creation function
-- 1) Enum type for payment method
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'MOBILE', 'OTHER');
  END IF;
END $$;

-- 2) Add columns to sales_records if missing
ALTER TABLE IF EXISTS sales_records
  ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'CASH' NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- 3) Update create_sale_with_stock_update to accept payment fields (appends params with defaults)
-- Drop specific older overloads if they exist to avoid ambiguity
DO $$
BEGIN
  -- Attempt to drop known signatures; ignore errors if they don't exist
  BEGIN
    DROP FUNCTION IF EXISTS create_sale_with_stock_update(text, text, integer, numeric, numeric, text, scan_type, text, uuid, boolean);
  EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN
    DROP FUNCTION IF EXISTS create_sale_with_stock_update(text, text, integer, numeric, numeric, text, text, text, uuid, boolean);
  EXCEPTION WHEN undefined_function THEN NULL; END;
END $$;

CREATE OR REPLACE FUNCTION create_sale_with_stock_update(
  p_product_code TEXT,
  p_product_name TEXT,
  p_quantity INTEGER,
  p_unit_price NUMERIC(10,2),
  p_total_amount NUMERIC(10,2),
  p_customer_name TEXT,
  p_scan_type scan_type DEFAULT 'manual',
  p_scanned_data TEXT DEFAULT NULL,
  p_user_id UUID,
  p_allow_negative_stock BOOLEAN DEFAULT FALSE,
  p_payment_method payment_method DEFAULT 'CASH',
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS TABLE (sale_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_current_stock integer;
  v_new_stock integer;
  v_sale_id uuid;
BEGIN
  -- Find product by code or name and lock row
  SELECT id, current_stock INTO v_product_id, v_current_stock
  FROM products
  WHERE (code = p_product_code OR name = p_product_name) AND is_active = true
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  -- Calculate new stock
  v_new_stock := v_current_stock - p_quantity;

  IF v_new_stock < 0 AND NOT p_allow_negative_stock THEN
    RAISE EXCEPTION 'insufficient_stock' USING DETAIL = v_current_stock::text;
  END IF;

  -- Create the sales record
  INSERT INTO sales_records (
    product_code,
    product_name,
    quantity,
    unit_price,
    total_amount,
    customer_name,
    payment_method,
    payment_reference,
    scan_type,
    scanned_data,
    user_id
  ) VALUES (
    p_product_code,
    p_product_name,
    p_quantity,
    p_unit_price,
    p_total_amount,
    p_customer_name,
    p_payment_method,
    p_payment_reference,
    p_scan_type,
    p_scanned_data,
    p_user_id
  ) RETURNING id INTO v_sale_id;

  -- Update product stock
  UPDATE products SET current_stock = v_new_stock, updated_at = now() WHERE id = v_product_id;

  -- Audit stock movement
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    unit_cost,
    reference_number,
    notes,
    user_id
  ) VALUES (
    v_product_id,
    'OUT',
    p_quantity,
    (SELECT cost_price FROM products WHERE id = v_product_id),
    'SALE-' || v_sale_id::text,
    'Automatic stock reduction from sale to ' || p_customer_name,
    p_user_id
  );

  RETURN QUERY SELECT v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_sale_with_stock_update(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, TEXT, scan_type, TEXT, UUID, BOOLEAN, payment_method, TEXT) TO authenticated;


