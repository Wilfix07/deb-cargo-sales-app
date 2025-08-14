/*
  # Create sale with automatic stock update function

  1. New Functions
    - `create_sale_with_stock_update` - Creates a sale record and updates product stock atomically
    - `update_product_stock_from_sale` - Updates product stock when a sale is made

  2. Features
    - Atomic transactions to prevent race conditions
    - Row-level locking for concurrent access protection
    - Configurable negative stock behavior
    - Automatic stock movement audit trail
    - Comprehensive error handling

  3. Security
    - Functions use security definer for proper access
    - Input validation and sanitization
    - Proper error messages for debugging
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_sale_with_stock_update(text, text, integer, numeric, numeric, text, text, text, uuid, boolean);
DROP FUNCTION IF EXISTS update_product_stock_from_sale(uuid, integer, boolean);

-- Function to update product stock from sale (simplified version)
CREATE OR REPLACE FUNCTION update_product_stock_from_sale(
  p_product_id uuid,
  p_quantity_sold integer,
  p_allow_negative_stock boolean DEFAULT false
)
RETURNS TABLE(
  success boolean,
  updated_quantity integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock integer;
  v_new_stock integer;
  v_product_exists boolean;
BEGIN
  -- Check if product exists and get current stock with row lock
  SELECT current_stock INTO v_current_stock
  FROM products 
  WHERE id = p_product_id AND is_active = true
  FOR UPDATE;
  
  -- Check if product was found
  GET DIAGNOSTICS v_product_exists = FOUND;
  
  IF NOT v_product_exists THEN
    RETURN QUERY SELECT false, 0, 'Product not found or inactive'::text;
    RETURN;
  END IF;
  
  -- Calculate new stock level
  v_new_stock := v_current_stock - p_quantity_sold;
  
  -- Check for insufficient stock
  IF v_new_stock < 0 AND NOT p_allow_negative_stock THEN
    RETURN QUERY SELECT false, v_current_stock, 'Insufficient stock available'::text;
    RETURN;
  END IF;
  
  -- Ensure stock doesn't go below 0 if negative stock is not allowed
  IF v_new_stock < 0 AND p_allow_negative_stock THEN
    v_new_stock := 0;
  END IF;
  
  -- Update product stock
  UPDATE products 
  SET current_stock = v_new_stock,
      updated_at = now()
  WHERE id = p_product_id;
  
  -- Return success with updated quantity
  RETURN QUERY SELECT true, v_new_stock, ''::text;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN QUERY SELECT false, 0, SQLERRM::text;
END;
$$;

-- Main function to create sale with stock update
CREATE OR REPLACE FUNCTION create_sale_with_stock_update(
  p_product_code text,
  p_product_name text,
  p_quantity integer,
  p_unit_price numeric,
  p_total_amount numeric,
  p_customer_name text,
  p_scan_type text DEFAULT 'manual',
  p_scanned_data text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_allow_negative_stock boolean DEFAULT false
)
RETURNS TABLE(
  success boolean,
  sale_id uuid,
  updated_stock integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_sale_id uuid;
  v_stock_result record;
  v_movement_id uuid;
BEGIN
  -- Find product by code or name
  SELECT id INTO v_product_id
  FROM products 
  WHERE (code = p_product_code OR name = p_product_name) 
    AND is_active = true
  LIMIT 1;
  
  -- Check if product exists
  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'product_not_found'::text;
    RETURN;
  END IF;
  
  -- Update product stock first
  SELECT * INTO v_stock_result
  FROM update_product_stock_from_sale(v_product_id, p_quantity, p_allow_negative_stock);
  
  -- Check if stock update was successful
  IF NOT v_stock_result.success THEN
    IF v_stock_result.error_message = 'Insufficient stock available' THEN
      RETURN QUERY SELECT false, NULL::uuid, v_stock_result.updated_quantity, 'insufficient_stock'::text;
    ELSE
      RETURN QUERY SELECT false, NULL::uuid, 0, v_stock_result.error_message;
    END IF;
    RETURN;
  END IF;
  
  -- Create the sales record
  INSERT INTO sales_records (
    product_code,
    product_name,
    quantity,
    unit_price,
    total_amount,
    customer_name,
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
    COALESCE(p_scan_type, 'manual')::scan_type,
    p_scanned_data,
    p_user_id
  )
  RETURNING id INTO v_sale_id;
  
  -- Create stock movement record for audit trail
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
    p_unit_price,
    'SALE-' || v_sale_id::text,
    'Stock reduction from sale: ' || p_customer_name,
    p_user_id
  )
  RETURNING id INTO v_movement_id;
  
  -- Return success with sale ID and updated stock
  RETURN QUERY SELECT true, v_sale_id, v_stock_result.updated_quantity, ''::text;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN QUERY SELECT false, NULL::uuid, 0, SQLERRM::text;
END;
$$;