/*
  # Enhanced Sale Management Functions

  1. New Functions
    - `update_product_stock_for_sale_edit` - Handles stock updates when sales are edited
    - `delete_sale_with_stock_restore` - Safely deletes sales and restores stock
    - `get_sale_with_product_info` - Gets sale details with product information

  2. Security
    - Functions use security definer for proper permissions
    - Proper error handling and validation
    - Audit trail for all stock changes

  3. Performance
    - Atomic operations prevent race conditions
    - Efficient queries with proper indexing
    - Minimal data transfer
*/

-- OPTIMIZATION: Function to update product stock when sales are edited
CREATE OR REPLACE FUNCTION update_product_stock_for_sale_edit(
  p_product_id uuid,
  p_quantity_change integer,
  p_reference_number text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_record products%ROWTYPE;
  v_new_stock integer;
  v_movement_id uuid;
BEGIN
  -- OPTIMIZATION: Lock the product row to prevent race conditions
  SELECT * INTO v_product_record
  FROM products 
  WHERE id = p_product_id AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'product_not_found',
      'message', 'Product not found or inactive'
    );
  END IF;
  
  -- Calculate new stock level
  v_new_stock := v_product_record.current_stock + p_quantity_change;
  
  -- OPTIMIZATION: Prevent negative stock (configurable behavior)
  IF v_new_stock < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'insufficient_stock',
      'message', 'Insufficient stock for this operation',
      'current_stock', v_product_record.current_stock,
      'requested_change', p_quantity_change,
      'would_result_in', v_new_stock
    );
  END IF;
  
  -- OPTIMIZATION: Update product stock atomically
  UPDATE products 
  SET 
    current_stock = v_new_stock,
    updated_at = now()
  WHERE id = p_product_id;
  
  -- OPTIMIZATION: Create stock movement record for audit trail
  IF p_quantity_change != 0 THEN
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity,
      reference_number,
      notes,
      user_id
    ) VALUES (
      p_product_id,
      CASE 
        WHEN p_quantity_change > 0 THEN 'IN'
        ELSE 'OUT'
      END,
      abs(p_quantity_change),
      COALESCE(p_reference_number, 'SALE-EDIT-' || gen_random_uuid()::text),
      'Stock adjustment from sale edit',
      p_user_id
    )
    RETURNING id INTO v_movement_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'product_id', p_product_id,
    'old_stock', v_product_record.current_stock,
    'new_stock', v_new_stock,
    'quantity_change', p_quantity_change,
    'movement_id', v_movement_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- OPTIMIZATION: Comprehensive error handling
    RETURN json_build_object(
      'success', false,
      'error', 'database_error',
      'message', 'Database error: ' || SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- OPTIMIZATION: Enhanced function to delete sale and restore stock
CREATE OR REPLACE FUNCTION delete_sale_with_stock_restore(
  p_sale_id uuid,
  p_product_id uuid DEFAULT NULL,
  p_quantity_to_restore integer DEFAULT 0,
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_record sales_records%ROWTYPE;
  v_product_record products%ROWTYPE;
  v_movement_id uuid;
BEGIN
  -- OPTIMIZATION: Get sale details before deletion
  SELECT * INTO v_sale_record
  FROM sales_records 
  WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'sale_not_found',
      'message', 'Sale record not found'
    );
  END IF;
  
  -- OPTIMIZATION: If product info provided, restore stock
  IF p_product_id IS NOT NULL AND p_quantity_to_restore > 0 THEN
    -- Lock the product row to prevent race conditions
    SELECT * INTO v_product_record
    FROM products 
    WHERE id = p_product_id AND is_active = true
    FOR UPDATE;
    
    IF FOUND THEN
      -- OPTIMIZATION: Restore stock atomically
      UPDATE products 
      SET 
        current_stock = current_stock + p_quantity_to_restore,
        updated_at = now()
      WHERE id = p_product_id;
      
      -- OPTIMIZATION: Create stock movement record for audit
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        reference_number,
        notes,
        user_id
      ) VALUES (
        p_product_id,
        'IN',
        p_quantity_to_restore,
        'SALE-DELETE-' || p_sale_id::text,
        'Stock restored from deleted sale: ' || v_sale_record.product_name,
        COALESCE(p_user_id, v_sale_record.user_id)
      )
      RETURNING id INTO v_movement_id;
    END IF;
  END IF;
  
  -- OPTIMIZATION: Delete the sales record
  DELETE FROM sales_records WHERE id = p_sale_id;
  
  RETURN json_build_object(
    'success', true,
    'sale_id', p_sale_id,
    'product_id', p_product_id,
    'quantity_restored', p_quantity_to_restore,
    'movement_id', v_movement_id,
    'product_code', v_sale_record.product_code
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- OPTIMIZATION: Comprehensive error handling with rollback
    RETURN json_build_object(
      'success', false,
      'error', 'database_error',
      'message', 'Database error during deletion: ' || SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- OPTIMIZATION: Function to get sale details with product information
CREATE OR REPLACE FUNCTION get_sale_with_product_info(p_sale_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'sale', json_build_object(
      'id', sr.id,
      'product_code', sr.product_code,
      'product_name', sr.product_name,
      'quantity', sr.quantity,
      'unit_price', sr.unit_price,
      'total_amount', sr.total_amount,
      'customer_name', sr.customer_name,
      'scan_type', sr.scan_type,
      'scanned_data', sr.scanned_data,
      'user_id', sr.user_id,
      'created_at', sr.created_at
    ),
    'product', json_build_object(
      'id', p.id,
      'current_stock', p.current_stock,
      'min_stock_level', p.min_stock_level,
      'max_stock_level', p.max_stock_level,
      'unit_of_measure', p.unit_of_measure
    )
  ) INTO v_result
  FROM sales_records sr
  LEFT JOIN products p ON (p.code = sr.product_code OR p.name = sr.product_name) AND p.is_active = true
  WHERE sr.id = p_sale_id;
  
  IF v_result IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'sale_not_found',
      'message', 'Sale record not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'data', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'database_error',
      'message', 'Database error: ' || SQLERRM
    );
END;
$$;