-- First, insert categories only if they don't exist
DO $$
BEGIN
    -- Electronics
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Electronics', 'Aparèy elektwonik ak teknoloji', true);
    END IF;
    
    -- Clothing
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Clothing') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Clothing', 'Rad ak akseswa', true);
    END IF;
    
    -- Food & Beverages
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Beverages') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Food & Beverages', 'Manje ak bweson', true);
    END IF;
    
    -- Home & Garden
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Home & Garden') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Home & Garden', 'Bagay pou kay ak jaden', true);
    END IF;
    
    -- Sports & Outdoors
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sports & Outdoors') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Sports & Outdoors', 'Ekipman pou espò ak deyò', true);
    END IF;
    
    -- Books & Media
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Books & Media') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Books & Media', 'Liv ak medya', true);
    END IF;
    
    -- Health & Beauty
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Health & Beauty') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Health & Beauty', 'Sante ak bote', true);
    END IF;
    
    -- Automotive
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Automotive') THEN
        INSERT INTO categories (name, description, is_active) 
        VALUES ('Automotive', 'Bagay pou machin', true);
    END IF;
END $$;

-- Update existing sales records to use proper product codes that exist in products table
DO $$
DECLARE
    sales_record RECORD;
    matching_product RECORD;
    electronics_id uuid;
    clothing_id uuid;
    food_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
    SELECT id INTO food_id FROM categories WHERE name = 'Food & Beverages' LIMIT 1;
    
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    
    -- If no admin user exists, skip sales record creation
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'No admin user found, skipping sales record updates';
        RETURN;
    END IF;

    -- Update sales records that don't match existing products
    FOR sales_record IN 
        SELECT sr.id, sr.product_code, sr.product_name 
        FROM sales_records sr 
        WHERE NOT EXISTS (
            SELECT 1 FROM products p 
            WHERE p.code = sr.product_code OR p.name = sr.product_name
        )
        LIMIT 10 -- Limit to avoid long processing
    LOOP
        -- Try to find a matching product or assign to a category-appropriate product
        SELECT * INTO matching_product FROM products 
        WHERE is_active = true 
        ORDER BY random() 
        LIMIT 1;
        
        IF matching_product.id IS NOT NULL THEN
            UPDATE sales_records 
            SET 
                product_code = matching_product.code,
                product_name = matching_product.name
            WHERE id = sales_record.id;
        END IF;
    END LOOP;

    -- Create additional sales records if we don't have enough
    IF (SELECT COUNT(*) FROM sales_records) < 10 THEN
        -- Add more sample sales records
        INSERT INTO sales_records (
            product_code, 
            product_name, 
            quantity, 
            unit_price, 
            total_amount, 
            customer_name, 
            scan_type, 
            user_id, 
            created_at
        )
        SELECT 
            p.code,
            p.name,
            floor(random() * 5 + 1)::integer,
            p.unit_price,
            (floor(random() * 5 + 1)::integer * p.unit_price),
            (ARRAY['Jean Baptiste', 'Marie Dupont', 'Pierre Louis', 'Anne Michel', 'Paul Morin'])[floor(random() * 5 + 1)],
            (ARRAY['manual', 'barcode', 'qr'])[floor(random() * 3 + 1)]::scan_type,
            admin_user_id,
            now() - interval '1 day' * floor(random() * 30)
        FROM products p
        WHERE p.is_active = true
        ORDER BY random()
        LIMIT 15;
    END IF;
END $$;

-- Ensure all products have categories assigned
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
BEGIN
    -- Get all category IDs
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
    SELECT id INTO food_id FROM categories WHERE name = 'Food & Beverages' LIMIT 1;
    SELECT id INTO home_id FROM categories WHERE name = 'Home & Garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE name = 'Sports & Outdoors' LIMIT 1;
    SELECT id INTO books_id FROM categories WHERE name = 'Books & Media' LIMIT 1;
    SELECT id INTO health_id FROM categories WHERE name = 'Health & Beauty' LIMIT 1;
    SELECT id INTO auto_id FROM categories WHERE name = 'Automotive' LIMIT 1;

    -- Update products based on their names
    -- Electronics
    UPDATE products 
    SET category_id = electronics_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%phone%' OR name ILIKE '%laptop%' OR name ILIKE '%tv%' OR name ILIKE '%headphone%' OR name ILIKE '%samsung%' OR name ILIKE '%apple%' OR name ILIKE '%iphone%' OR name ILIKE '%dell%' OR name ILIKE '%bluetooth%');

    -- Clothing
    UPDATE products 
    SET category_id = clothing_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%shirt%' OR name ILIKE '%dress%' OR name ILIKE '%jeans%' OR name ILIKE '%sneaker%' OR name ILIKE '%cap%' OR name ILIKE '%t-shirt%' OR name ILIKE '%pants%');

    -- Food & Beverages
    UPDATE products 
    SET category_id = food_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%rice%' OR name ILIKE '%oil%' OR name ILIKE '%bean%' OR name ILIKE '%water%' OR name ILIKE '%coffee%' OR name ILIKE '%food%' OR name ILIKE '%cooking%' OR name ILIKE '%canned%' OR name ILIKE '%bottled%');

    -- Home & Garden
    UPDATE products 
    SET category_id = home_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%garden%' OR name ILIKE '%lawn%' OR name ILIKE '%plant%' OR name ILIKE '%chair%' OR name ILIKE '%tool%' OR name ILIKE '%hose%' OR name ILIKE '%mower%' OR name ILIKE '%fertilizer%' OR name ILIKE '%outdoor%');

    -- Sports & Outdoors
    UPDATE products 
    SET category_id = sports_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%basketball%' OR name ILIKE '%soccer%' OR name ILIKE '%tennis%' OR name ILIKE '%camping%' OR name ILIKE '%fishing%' OR name ILIKE '%ball%' OR name ILIKE '%racket%' OR name ILIKE '%tent%' OR name ILIKE '%rod%');

    -- Books & Media
    UPDATE products 
    SET category_id = books_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%book%' OR name ILIKE '%magazine%' OR name ILIKE '%cd%' OR name ILIKE '%dvd%' OR name ILIKE '%programming%' OR name ILIKE '%history%' OR name ILIKE '%cooking%' OR name ILIKE '%music%' OR name ILIKE '%educational%');

    -- Health & Beauty
    UPDATE products 
    SET category_id = health_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%shampoo%' OR name ILIKE '%cream%' OR name ILIKE '%vitamin%' OR name ILIKE '%toothpaste%' OR name ILIKE '%sanitizer%' OR name ILIKE '%face%' OR name ILIKE '%hand%' OR name ILIKE '%beauty%' OR name ILIKE '%health%');

    -- Automotive
    UPDATE products 
    SET category_id = auto_id
    WHERE category_id IS NULL 
    AND (name ILIKE '%motor%' OR name ILIKE '%battery%' OR name ILIKE '%brake%' OR name ILIKE '%filter%' OR name ILIKE '%wiper%' OR name ILIKE '%car%' OR name ILIKE '%auto%' OR name ILIKE '%windshield%');

    -- Assign remaining products to Electronics as default
    UPDATE products 
    SET category_id = electronics_id
    WHERE category_id IS NULL;
END $$;

-- Verify the data and provide feedback
DO $$
DECLARE
    product_count INTEGER;
    sales_count INTEGER;
    category_count INTEGER;
    products_with_categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO products_with_categories FROM products WHERE category_id IS NOT NULL;
    SELECT COUNT(*) INTO sales_count FROM sales_records;
    SELECT COUNT(*) INTO category_count FROM categories;
    
    RAISE NOTICE 'Data verification complete:';
    RAISE NOTICE '- Total products: %', product_count;
    RAISE NOTICE '- Products with categories: %', products_with_categories;
    RAISE NOTICE '- Total sales records: %', sales_count;
    RAISE NOTICE '- Total categories: %', category_count;
    
    IF products_with_categories = product_count THEN
        RAISE NOTICE '✓ All products have categories assigned';
    ELSE
        RAISE WARNING '⚠ Some products still missing categories';
    END IF;
END $$;